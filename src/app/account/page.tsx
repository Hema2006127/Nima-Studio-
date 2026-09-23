import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n/server';
import { format, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';
import { getSiteSettings } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatMoney, localized, whatsappLink } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, LoadError } from '@/components/sections';
import { CancelBookingButton } from './cancel-button';
import type { Booking, Payment, Quotation, Service } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.myBookings };
}

type BookingRow = Booking & { booking_services: Array<{ services: Pick<Service, 'title_en' | 'title_ar'> | null }> };

export default async function AccountPage({ searchParams }: PageProps<'/account'>) {
  const user = await requireUser('/account');
  const { id } = await searchParams;
  const [{ locale, t }, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  const supabase = await createClient();

  // RLS limits this to the signed-in customer's own bookings.
  const { data, error } = await supabase
    .from('bookings')
    .select('*, booking_services(services(title_en, title_ar))')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  const bookings = (data as BookingRow[] | null) ?? [];
  const selected = bookings.find((b) => b.id === id) ?? bookings[0];

  let quotation: Quotation | null = null;
  let payments: Payment[] = [];
  if (selected) {
    const [q, p] = await Promise.all([
      supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('booking_id', selected.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<Quotation>(),
      supabase.from('payments').select('*').eq('booking_id', selected.id).order('paid_at'),
    ]);
    quotation = q.data;
    payments = (p.data as Payment[] | null) ?? [];
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-5xl">{t.account.myBookings}</h1>
        <Link href="/book" className="btn-primary">
          {t.account.newBooking}
        </Link>
      </div>

      {error ? (
        <LoadError t={t} />
      ) : bookings.length === 0 ? (
        <EmptyState>
          <p>{t.account.noBookings}</p>
          <Link href="/book" className="btn-primary mt-5">
            {t.nav.book}
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(260px,340px)_1fr]">
          <ul className="min-w-0 space-y-3">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/account?id=${b.id}`}
                  className={`card block p-5 transition-colors ${b.id === selected?.id ? '!border-ink' : 'hover:border-ink/40'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{t.eventTypes[b.event_type]}</p>
                    <StatusBadge status={b.status} label={t.status[b.status]} />
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    {formatDate(b.event_date, locale)} · {b.venue}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {selected && (
            <BookingDetail booking={selected} quotation={quotation} payments={payments} locale={locale} t={t} whatsapp={settings?.whatsapp_number ?? null} />
          )}
        </div>
      )}
    </>
  );
}

const TIMELINE = ['pending', 'quoted', 'confirmed', 'completed'] as const;

function BookingDetail({
  booking,
  quotation,
  payments,
  locale,
  t,
  whatsapp,
}: {
  booking: BookingRow;
  quotation: Quotation | null;
  payments: Payment[];
  locale: Locale;
  t: Dictionary;
  whatsapp: string | null;
}) {
  const coverage = booking.booking_services
    .map((bs) => (bs.services ? localized(bs.services, 'title', locale) : ''))
    .filter(Boolean)
    .join(' + ');
  const meta = [formatDate(booking.event_date, locale), booking.guest_count ? `${booking.guest_count} ${t.account.guests}` : '', coverage]
    .filter(Boolean)
    .join(' · ');
  const reached = TIMELINE.indexOf(booking.status as (typeof TIMELINE)[number]);
  const items = [...(quotation?.quotation_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const ref = `#${booking.reference}`;
  const confirmLink = whatsappLink(whatsapp, `${t.account.confirmWhatsapp} — ${t.account.booking} ${ref}`);
  const askLink = whatsappLink(whatsapp, `${t.account.booking} ${ref}: `);

  return (
    <section className="card flex min-w-0 flex-col p-6 sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-ink-soft">
            {t.account.booking} {ref}
          </p>
          <h2 className="mt-2 font-display text-4xl">
            {t.eventTypes[booking.event_type]} — {booking.venue}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">{meta}</p>
        </div>
        <StatusBadge status={booking.status} label={t.status[booking.status]} />
      </div>

      {booking.status !== 'cancelled' && (
        <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TIMELINE.map((s, i) => (
            <li key={s} className={`border-t-[3px] pt-3 ${i <= reached ? 'border-ink' : 'border-line'}`}>
              <p className={`text-sm ${i <= reached ? 'font-medium text-ink' : 'text-ink-soft'}`}>{t.status[s]}</p>
              <p className="mt-1 text-xs text-ink-soft">{t.statusHint[s]}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 bg-bg p-6">
        {quotation ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium">{t.account.yourQuotation}</h3>
              {quotation.valid_until && (
                <p className="text-xs text-ink-soft">{format(t.account.validUntil, { date: formatDate(quotation.valid_until, locale) })}</p>
              )}
            </div>
            <ul className="mt-4 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span>{item.description}</span>
                  <span className="whitespace-nowrap">{formatMoney(item.amount, quotation!.currency, locale)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-line pt-4 text-lg font-medium">
              <span>{t.account.total}</span>
              <span>{formatMoney(total, quotation.currency, locale)}</span>
            </div>
            {quotation.notes && <p className="mt-4 whitespace-pre-line text-sm text-ink-soft">{quotation.notes}</p>}
          </>
        ) : (
          <p className="text-sm text-ink-soft">{t.account.awaitingQuote}</p>
        )}
      </div>

      {payments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium">{t.account.payments}</h3>
          <ul className="mt-2 divide-y divide-line text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span className="text-ink-soft">{formatDate(p.paid_at, locale)}</span>
                <span>{formatMoney(p.amount, p.currency, locale)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between text-sm font-medium">
            <span>{t.account.paid}</span>
            <span>{formatMoney(paid, payments[0].currency, locale)}</span>
          </p>
        </div>
      )}

      {booking.notes && (
        <div className="mt-6">
          <h3 className="text-sm font-medium">{t.account.notes}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{booking.notes}</p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {booking.status === 'quoted' && confirmLink && (
          <a href={confirmLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
            {t.account.confirmWhatsapp}
          </a>
        )}
        {askLink && (
          <a href={askLink} target="_blank" rel="noopener noreferrer" className="btn-outline">
            {t.account.askQuestion}
          </a>
        )}
        {(booking.status === 'pending' || booking.status === 'quoted') && (
          <CancelBookingButton bookingId={booking.id} label={t.account.cancel} confirmText={t.account.cancelConfirm} />
        )}
      </div>
    </section>
  );
}
