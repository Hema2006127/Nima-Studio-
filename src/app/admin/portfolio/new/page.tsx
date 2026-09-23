import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '../../ui';
import { PortfolioForm } from '../portfolio-form';

export default async function NewPortfolioItemPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add YouTube film"
        actions={
          <Link href="/admin/portfolio" className="btn-ghost">
            ← Back to portfolio
          </Link>
        }
      />
      <PortfolioForm />
    </>
  );
}
