import Link from 'next/link';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/server';
import { getPublishedPortfolio } from '@/lib/data';
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from '@/lib/types';
import { EmptyState, LoadError, PortfolioCard } from '@/components/sections';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.portfolio.title };
}

export default async function PortfolioPage({ searchParams }: PageProps<'/portfolio'>) {
  const { category: raw } = await searchParams;
  const category = PORTFOLIO_CATEGORIES.includes(raw as PortfolioCategory) ? (raw as PortfolioCategory) : undefined;
  const [{ locale, t }, portfolio] = await Promise.all([getDictionary(), getPublishedPortfolio({ category })]);

  const filters: Array<{ key?: PortfolioCategory; label: string }> = [
    { label: t.categories.all },
    ...PORTFOLIO_CATEGORIES.map((c) => ({ key: c, label: t.categories[c] })),
  ];

  return (
    <div className="container-x py-14 lg:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">{t.portfolio.eyebrow}</p>
          <h1 className="display text-5xl sm:text-6xl">{t.portfolio.title}</h1>
          <p className="mt-3 text-sm text-ink-soft">{t.portfolio.subtitle}</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Filter">
          {filters.map((f) => {
            const active = f.key === category;
            return (
              <Link
                key={f.label}
                href={f.key ? `/portfolio?category=${f.key}` : '/portfolio'}
                aria-current={active ? 'true' : undefined}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  active ? 'border-primary bg-primary text-primary-fg' : 'border-line text-ink hover:border-ink/50'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {portfolio.error ? (
        <LoadError t={t} />
      ) : portfolio.data.length === 0 ? (
        <EmptyState>{t.portfolio.empty}</EmptyState>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.data.map((item) => (
            <PortfolioCard key={item.id} item={item} locale={locale} t={t} showCategory />
          ))}
        </div>
      )}
    </div>
  );
}
