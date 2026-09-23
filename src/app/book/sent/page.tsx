import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';
import { requireUser } from '@/lib/auth';
import { MinimalHeader } from '@/components/minimal-header';
import { Steps } from '@/components/booking-steps';

export default async function BookingSentPage({ searchParams }: PageProps<'/book/sent'>) {
  await requireUser('/account');
  const { id } = await searchParams;
  const bookingId = typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  const { t } = await getDictionary();

  return (
    <>
      <MinimalHeader />
      <main className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-16">
        <div>
          <p className="eyebrow mb-4">{t.booking.eyebrow}</p>
          <h1 className="display text-5xl sm:text-6xl">{t.booking.title}</h1>
          <Steps t={t} active={4} />
        </div>
        <div className="card p-6 sm:p-10">
          <h2 className="font-display text-3xl">{t.booking.sentTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.booking.sentText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={bookingId ? `/account?id=${bookingId}` : '/account'} className="btn-primary">
              {t.booking.viewBooking}
            </Link>
            <Link href="/" className="btn-outline">
              {t.common.backToWebsite}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
