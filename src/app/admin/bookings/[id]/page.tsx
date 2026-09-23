import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatMoney, whatsappLink } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '../../ui';
import { DeleteButton } from '../../delete-button';
import { BookingStatusForm, PaymentForm, QuotationForm } from '../forms';
import { deletePayment, setQuotationStatus } from '../actions';
import type { Booking, Payment, Quotation } from '@/lib/types';

type Detail = Booking & {
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
  booking_services: Array<{ services: { title_en: string } | null }>;
};

export default async function AdminBookingDetailPage({ params }: PageProps<'/admin/bookings/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: booking }, { data: quotations }, { data: paymentsData }] = await Promise.all([
    supabase.from('bookings').select('*, profiles(full_name, email, phone), booking_services(services(title_en))').eq('id', id).maybeSingle<Detail>(),
    supabase.from('quotations').select('*, quotation_items(*)').eq('booking_id', id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('booking_id', id).order('paid_at'),
  ]);
  if (!booking) notFound();

  const quotation = ((quotations as Quotation[] | null) ?? [])[0] ?? null;
  const payments = (paymentsData as Payment[] | null) ?? [];
  const quoteTotal = (quotation?.quotation_items ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const currency = quotation?.currency ?? 'EGP';
  const coverage = booking.booking_services.map((b) => b.services?.title_en).filter(Boolean).join(', ');
  const wa = whatsappLink(booking.contact_phone, `Hello ${booking.contact_name}, regarding your booking #${booking.reference}`);

  return (
    <>
      <PageHeader
        title={`Booking #${booking.reference}`}
        actions={
          <>
            <StatusBadge status={booking.status} />
            <Link href="/admin/bookings" className="btn-ghost">
              ← All bookings
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-medium">Event</h2>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Item label="Type" value={<span className="capitalize">{booking.event_type}</span>} />
              <Item label="Date" value={formatDate(booking.event_date, 'en', { weekday: 'short' })} />
              <Item label="Venue" value={booking.venue} />
              <Item label="Guests" value={booking.guest_count ?? '—'} />
              <Item label="Coverage" value={coverage || '—'} />
              <Item label="Requested" value={formatDate(booking.created_at)} />
            </dl>
            {booking.notes && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs uppercase tracking-wider text-ink-soft">Customer notes</p>
                <p className="mt-1 whitespace-pre-line text-sm">{booking.notes}</p>
              </div>
            )}
          </section>

          <section className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Quotation</h2>
              {quotation && (
                <div className="flex items-center gap-2">
                  <StatusBadge status={quotation.status} />
                  {quotation.status === 'sent' && (
                    <>
                      <QuoteStatusButton id={quotation.id} bookingId={booking.id} status="accepted" label="Mark accepted" />
                      <QuoteStatusButton id={quotation.id} bookingId={booking.id} status="declined" label="Mark declined" />
                    </>
                  )}
                </div>
              )}
            </div>
            <QuotationForm key={quotation?.updated_at ?? 'new'} bookingId={booking.id} quotation={quotation} />
          </section>

          <section className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Payments</h2>
              <p className="text-sm text-ink-soft">
                Paid {formatMoney(paid, currency)}
                {quoteTotal > 0 && ` of ${formatMoney(quoteTotal, currency)}`}
              </p>
            </div>
            {payments.length > 0 && (
              <ul className="mb-6 divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <span>
                      {formatDate(p.paid_at)} · <span className="capitalize">{p.method.replace('_', ' ')}</span>
                      {p.reference && <span className="text-ink-soft"> · {p.reference}</span>}
                    </span>
                    <span className="flex items-center gap-4">
                      {formatMoney(p.amount, p.currency)}
                      <DeleteButton
                        action={deletePayment}
                        id={`${p.id}:${booking.id}`}
                        label="Delete"
                        confirmText="Delete this payment record?"
                        className="btn-danger btn-sm !px-0"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <PaymentForm bookingId={booking.id} currency={currency} canConfirm={booking.status === 'pending' || booking.status === 'quoted'} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-medium">Client</h2>
            <dl className="space-y-3 text-sm">
              <Item label="Name" value={booking.contact_name} />
              <Item label="Phone" value={<span dir="ltr">{booking.contact_phone}</span>} />
              <Item label="Account" value={booking.profiles?.email ?? '—'} />
            </dl>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline mt-5 w-full">
                Message on WhatsApp
              </a>
            )}
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-medium">Status & notes</h2>
            <BookingStatusForm key={booking.updated_at} booking={booking} />
          </section>
        </aside>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function QuoteStatusButton({ id, bookingId, status, label }: { id: string; bookingId: string; status: string; label: string }) {
  return (
    <form action={setQuotationStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="status" value={status} />
      <button className="btn-outline btn-sm">{label}</button>
    </form>
  );
}
