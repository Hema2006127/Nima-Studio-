import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/server';
import { getPublishedServices } from '@/lib/data';
import { EmptyState, LoadError, ServiceCard } from '@/components/sections';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.services };
}

export default async function ServicesPage() {
  const [{ locale, t }, services] = await Promise.all([getDictionary(), getPublishedServices()]);

  return (
    <div className="container-x py-14 lg:py-20">
      <p className="eyebrow mb-3">{t.services.eyebrow}</p>
      <h1 className="display text-5xl sm:text-6xl">{t.services.title}</h1>
      <p className="mt-4 max-w-xl text-ink-soft">{t.services.subtitle}</p>
      <div className="mt-12">
        {services.error ? (
          <LoadError t={t} />
        ) : services.data.length === 0 ? (
          <EmptyState>{t.home.noServices}</EmptyState>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.data.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} locale={locale} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
