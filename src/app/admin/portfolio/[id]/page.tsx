import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { storagePublicUrl } from '@/lib/supabase/env';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '../../ui';
import { PortfolioForm } from '../portfolio-form';
import { DeleteButton } from '../../delete-button';
import { deletePortfolioItem } from '../actions';
import type { PortfolioItem } from '@/lib/types';

export default async function EditPortfolioItemPage({ params }: PageProps<'/admin/portfolio/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: item } = await supabase.from('portfolio_items').select('*').eq('id', id).maybeSingle<PortfolioItem>();
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.title}
        actions={
          <>
            <StatusBadge status={item.is_published ? 'published' : 'unpublished'} label={item.is_published ? 'Published' : 'Draft'} />
            <Link href="/admin/portfolio" className="btn-ghost">
              ← Back to portfolio
            </Link>
          </>
        }
      />
      <PortfolioForm item={item} coverUrl={storagePublicUrl(item.cover_image_path)} />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton action={deletePortfolioItem} id={item.id} label="Delete this film" confirmText="Delete this film permanently? This also removes its cover image." />
      </div>
    </>
  );
}
