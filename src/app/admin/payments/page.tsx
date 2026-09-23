import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatMoney } from '@/lib/utils';
import { Empty, Notice, PageHeader, Table } from '../ui';
import type { Payment } from '@/lib/types';

type Row = Payment & { bookings: { reference: number; contact_name: string } | null };

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*, bookings(reference, contact_name)')
    .order('paid_at', { ascending: false })
    .limit(300);
  const rows = (data as Row[] | null) ?? [];
  const total = rows.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <PageHeader title="Payments" description="Record new payments from a booking’s page." />
      {error && <Notice tone="error">Could not load payments: {error.message}</Notice>}
      {rows.length === 0 && !error ? (
        <Empty>No payments recorded yet.</Empty>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-soft">
            Total shown: <span className="font-medium text-ink">{formatMoney(total, 'EGP')}</span>
          </p>
          <Table head={['Date', 'Booking', 'Client', 'Method', 'Amount', '']}>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3 whitespace-nowrap">{formatDate(p.paid_at)}</td>
                <td className="px-5 py-3 text-ink-soft">#{p.bookings?.reference}</td>
                <td className="px-5 py-3">{p.bookings?.contact_name}</td>
                <td className="px-5 py-3 capitalize">{p.method.replace('_', ' ')}</td>
                <td className="px-5 py-3">{formatMoney(p.amount, p.currency)}</td>
                <td className="px-5 py-3 text-end">
                  <Link href={`/admin/bookings/${p.booking_id}`} className="btn-outline btn-sm">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </>
  );
}
