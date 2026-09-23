import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/utils';
import { Empty, PageHeader } from './ui';
import { BookingsTable, type BookingRow } from './bookings/bookings-table';
import { QuickAddFilm } from './quick-add-film';

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [newInquiries, awaitingQuote, confirmedMonth, paymentsMonth, latest] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').gte('updated_at', monthStart),
    supabase.from('payments').select('amount').gte('paid_at', monthStart.slice(0, 10)),
    supabase.from('bookings').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(6),
  ]);

  const paymentsTotal = (paymentsMonth.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const stats = [
    { label: 'New inquiries (7 days)', value: newInquiries.count ?? 0 },
    { label: 'Awaiting quote', value: awaitingQuote.count ?? 0 },
    { label: 'Confirmed this month', value: confirmedMonth.count ?? 0 },
    { label: 'Payments this month', value: formatMoney(paymentsTotal, 'EGP') },
  ];
  const bookings = (latest.data as BookingRow[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <>
            <Link href="/admin/portfolio/new" className="btn-outline">
              Add YouTube film
            </Link>
            <Link href="/admin/bookings?status=pending" className="btn-primary">
              Pending bookings
            </Link>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card min-w-0 p-4 sm:p-5">
            <p className="text-sm text-ink-soft">{s.label}</p>
            <p className="mt-3 truncate font-display text-3xl sm:text-4xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Latest bookings</h2>
            <Link href="/admin/bookings" className="text-sm underline underline-offset-4">
              View all
            </Link>
          </div>
          {latest.error ? (
            <Empty>Could not load bookings: {latest.error.message}</Empty>
          ) : bookings.length === 0 ? (
            <Empty>No bookings yet.</Empty>
          ) : (
            <BookingsTable bookings={bookings} />
          )}
        </section>
        <QuickAddFilm />
      </div>
    </>
  );
}
