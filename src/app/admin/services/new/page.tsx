import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '../../ui';
import { ServiceForm } from '../service-form';

export default async function NewServicePage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New service"
        actions={
          <Link href="/admin/services" className="btn-ghost">
            ← Back to services
          </Link>
        }
      />
      <ServiceForm />
    </>
  );
}
