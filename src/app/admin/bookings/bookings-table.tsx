import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { Table } from '../ui';
import type { Booking } from '@/lib/types';

export type BookingRow = Booking & { profiles: { full_name: string | null; email: string | null } | null };

export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  return (
    <Table head={['Ref', 'Client', 'Event', 'Date', 'Status', '']}>
      {bookings.map((b) => (
        <tr key={b.id}>
          <td className="px-5 py-3 text-ink-soft">#{b.reference}</td>
          <td className="px-5 py-3">
            <p className="font-medium">{b.contact_name}</p>
            <p className="text-xs text-ink-soft">{b.profiles?.email}</p>
          </td>
          <td className="px-5 py-3 capitalize">
            {b.event_type}
            <p className="text-xs normal-case text-ink-soft">{b.venue}</p>
          </td>
          <td className="px-5 py-3 whitespace-nowrap">{formatDate(b.event_date)}</td>
          <td className="px-5 py-3">
            <StatusBadge status={b.status} />
          </td>
          <td className="px-5 py-3 text-end">
            <Link href={`/admin/bookings/${b.id}`} className="btn-outline btn-sm">
              {b.status === 'pending' ? 'Send quote' : b.status === 'quoted' ? 'Follow up' : b.status === 'confirmed' ? 'Record payment' : 'View'}
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
}
