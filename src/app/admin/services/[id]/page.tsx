import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Notice, PageHeader } from '../../ui';
import { ServiceForm } from '../service-form';
import { DeleteButton } from '../../delete-button';
import { deleteService } from '../actions';
import type { Service } from '@/lib/types';

export default async function EditServicePage({ params, searchParams }: PageProps<'/admin/services/[id]'>) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: service } = await supabase.from('services').select('*').eq('id', id).maybeSingle<Service>();
  if (!service) notFound();

  return (
    <>
      <PageHeader
        title={service.title_en}
        actions={
          <Link href="/admin/services" className="btn-ghost">
            ← Back to services
          </Link>
        }
      />
      {sp.in_use && (
        <Notice tone="error">This service is linked to existing bookings, so it can’t be deleted. Untick “Published” to hide it instead.</Notice>
      )}
      <ServiceForm service={service} />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton action={deleteService} id={service.id} label="Delete this service" confirmText="Delete this service permanently?" />
      </div>
    </>
  );
}
