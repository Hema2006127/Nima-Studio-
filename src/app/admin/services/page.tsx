import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { Empty, Notice, PageHeader, Table } from '../ui';
import type { Service } from '@/lib/types';

export default async function AdminServicesPage({ searchParams }: PageProps<'/admin/services'>) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from('services').select('*').order('sort_order').order('created_at');
  const services = (data as Service[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Services"
        description="Packages shown on the home and services pages, and offered in the booking form."
        actions={
          <Link href="/admin/services/new" className="btn-primary">
            New service
          </Link>
        }
      />
      {params.saved && <Notice>Service saved.</Notice>}
      {params.deleted && <Notice>Service deleted.</Notice>}
      {error && <Notice tone="error">Could not load services: {error.message}</Notice>}
      {services.length === 0 && !error ? (
        <Empty>No services yet.</Empty>
      ) : (
        <Table head={['Order', 'Title', 'Price from', 'Status', '']}>
          {services.map((s) => (
            <tr key={s.id}>
              <td className="px-5 py-3 text-ink-soft">{s.sort_order}</td>
              <td className="px-5 py-3">
                <p className="font-medium">{s.title_en}</p>
                <p className="text-xs text-ink-soft" dir="rtl">
                  {s.title_ar}
                </p>
              </td>
              <td className="px-5 py-3">{s.price_from !== null ? formatMoney(s.price_from, s.currency) : '—'}</td>
              <td className="px-5 py-3">
                <StatusBadge status={s.is_published ? 'published' : 'unpublished'} label={s.is_published ? 'Published' : 'Hidden'} />
              </td>
              <td className="px-5 py-3 text-end">
                <Link href={`/admin/services/${s.id}`} className="btn-outline btn-sm">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
