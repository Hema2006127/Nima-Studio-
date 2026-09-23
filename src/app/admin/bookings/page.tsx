import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty, Notice, PageHeader } from '../ui';
import { BookingsTable, type BookingRow } from './bookings-table';
import { BOOKING_STATUSES, type BookingStatus } from '@/lib/types';

export default async function AdminBookingsPage({ searchParams }: PageProps<'/admin/bookings'>) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status = BOOKING_STATUSES.includes(raw as BookingStatus) ? (raw as BookingStatus) : undefined;

  const supabase = await createClient();
  let query = supabase.from('bookings').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  const bookings = (data as BookingRow[] | null) ?? [];

  return (
    <>
      <PageHeader title="Bookings" />
      <nav className="mb-6 flex flex-wrap gap-2">
        {[undefined, ...BOOKING_STATUSES].map((s) => (
          <Link
            key={s ?? 'all'}
            href={s ? `/admin/bookings?status=${s}` : '/admin/bookings'}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize ${s === status ? 'border-primary bg-primary text-primary-fg' : 'border-line hover:border-ink/50'}`}
          >
            {s ?? 'All'}
          </Link>
        ))}
      </nav>
      {error && <Notice tone="error">Could not load bookings: {error.message}</Notice>}
      {bookings.length === 0 && !error ? (
        <Empty>No bookings{status ? ` with status “${status}”` : ''} yet.</Empty>
      ) : (
        <BookingsTable bookings={bookings} />
      )}
    </>
  );
}
