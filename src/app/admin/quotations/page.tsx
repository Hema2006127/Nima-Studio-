import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { Empty, Notice, PageHeader, Table } from '../ui';
import type { Quotation } from '@/lib/types';

type Row = Quotation & { bookings: { reference: number; contact_name: string; event_type: string } | null };

export default async function AdminQuotationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quotations')
    .select('*, quotation_items(amount), bookings(reference, contact_name, event_type)')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data as Row[] | null) ?? [];

  return (
    <>
      <PageHeader title="Quotations" description="Create and edit quotations from a booking’s page." />
      {error && <Notice tone="error">Could not load quotations: {error.message}</Notice>}
      {rows.length === 0 && !error ? (
        <Empty>No quotations yet.</Empty>
      ) : (
        <Table head={['Booking', 'Client', 'Total', 'Valid until', 'Status', '']}>
          {rows.map((q) => (
            <tr key={q.id}>
              <td className="px-5 py-3 text-ink-soft">#{q.bookings?.reference}</td>
              <td className="px-5 py-3">
                {q.bookings?.contact_name}
                <p className="text-xs capitalize text-ink-soft">{q.bookings?.event_type}</p>
              </td>
              <td className="px-5 py-3">{formatMoney((q.quotation_items ?? []).reduce((s, i) => s + Number(i.amount), 0), q.currency)}</td>
              <td className="px-5 py-3">{formatDate(q.valid_until) || '—'}</td>
              <td className="px-5 py-3">
                <StatusBadge status={q.status} />
              </td>
              <td className="px-5 py-3 text-end">
                <Link href={`/admin/bookings/${q.booking_id}`} className="btn-outline btn-sm">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
