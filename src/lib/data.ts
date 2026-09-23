import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { PortfolioCategory, PortfolioItem, Service, SiteSettings } from '@/lib/types';

// Public content. RLS guarantees anonymous visitors only receive published rows;
// the explicit is_published filters keep admins' public view identical.

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (error) console.error('getSiteSettings', error.message);
  return (data as SiteSettings | null) ?? null;
});

export async function getPublishedServices(): Promise<{ data: Service[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
    .order('created_at');
  return { data: (data as Service[]) ?? [], error: error?.message ?? null };
}

export async function getPublishedPortfolio(options: {
  category?: PortfolioCategory;
  featuredOnly?: boolean;
  limit?: number;
} = {}): Promise<{ data: PortfolioItem[]; error: string | null }> {
  const supabase = await createClient();
  let query = supabase.from('portfolio_items').select('*').eq('is_published', true);
  if (options.category) query = query.eq('category', options.category);
  if (options.featuredOnly) query = query.eq('is_featured', true);
  query = query.order('sort_order').order('published_at', { ascending: false });
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  return { data: (data as PortfolioItem[]) ?? [], error: error?.message ?? null };
}

/** Featured items first, topped up with the latest published ones. */
export async function getHomeFilms(limit = 3) {
  const featured = await getPublishedPortfolio({ featuredOnly: true, limit });
  if (featured.error || featured.data.length >= limit) return featured;
  const latest = await getPublishedPortfolio({ limit: limit * 2 });
  const seen = new Set(featured.data.map((i) => i.id));
  return {
    data: [...featured.data, ...latest.data.filter((i) => !seen.has(i.id))].slice(0, limit),
    error: latest.error,
  };
}
