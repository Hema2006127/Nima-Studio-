import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages: Array<[string, number]> = [
    ['/', 1],
    ['/portfolio', 0.9],
    ['/services', 0.8],
    ['/book', 0.8],
    ['/about', 0.6],
    ['/contact', 0.6],
  ];
  return pages.map(([path, priority]) => ({ url: `${base}${path}`, changeFrequency: 'weekly', priority }));
}
