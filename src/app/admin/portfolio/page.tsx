import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { storagePublicUrl } from '@/lib/supabase/env';
import { videoThumbnailUrl } from '@/lib/video';
import { StatusBadge } from '@/components/status-badge';
import { Empty, Notice, PageHeader, Table } from '../ui';
import { movePortfolioItem, setPortfolioPublished } from './actions';
import type { PortfolioItem } from '@/lib/types';

export default async function AdminPortfolioPage({ searchParams }: PageProps<'/admin/portfolio'>) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });
  const items = (data as PortfolioItem[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Films and reels shown on the website. Upload the video to YouTube or Google Drive first, then add the link here."
        actions={
          <Link href="/admin/portfolio/new" className="btn-primary">
            Add film
          </Link>
        }
      />
      {params.saved && <Notice>Film saved.</Notice>}
      {params.deleted && <Notice>Film deleted.</Notice>}
      {error && <Notice tone="error">Could not load portfolio: {error.message}</Notice>}

      {items.length === 0 && !error ? (
        <Empty>
          No films yet.{' '}
          <Link href="/admin/portfolio/new" className="link">
            Add your first film
          </Link>
          .
        </Empty>
      ) : (
        <Table head={['', 'Title', 'Category', 'Status', 'Order', '']}>
          {items.map((item, i) => (
            <tr key={item.id} className="align-middle">
              <td className="w-28 px-5 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail */}
                <img
                  src={storagePublicUrl(item.cover_image_path) ?? videoThumbnailUrl({ provider: item.video_provider, id: item.video_id })}
                  alt=""
                  className="aspect-video w-24 object-cover"
                  loading="lazy"
                />
              </td>
              <td className="px-5 py-3">
                <Link href={`/admin/portfolio/${item.id}`} className="font-medium hover:underline">
                  {item.title}
                </Link>
                <p className="text-xs text-ink-soft">
                  {item.venue}
                  {item.is_featured && ' · ★ Featured'}
                </p>
              </td>
              <td className="px-5 py-3 capitalize text-ink-soft">{item.category}</td>
              <td className="px-5 py-3">
                <StatusBadge status={item.is_published ? 'published' : 'unpublished'} label={item.is_published ? 'Published' : 'Draft'} />
              </td>
              <td className="px-5 py-3">
                <div className="flex gap-1">
                  <form action={movePortfolioItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button className="btn-ghost btn-sm" disabled={i === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={movePortfolioItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button className="btn-ghost btn-sm" disabled={i === items.length - 1} aria-label="Move down">
                      ↓
                    </button>
                  </form>
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <form action={setPortfolioPublished}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="publish" value={item.is_published ? '0' : '1'} />
                    <button className="btn-outline btn-sm">{item.is_published ? 'Unpublish' : 'Publish'}</button>
                  </form>
                  <Link href={`/admin/portfolio/${item.id}`} className="btn-outline btn-sm">
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
