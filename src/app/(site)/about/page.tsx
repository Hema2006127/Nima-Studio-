import Link from 'next/link';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { localized } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.about };
}

export default async function AboutPage() {
  const [{ locale, t }, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  const about = (settings && localized(settings, 'about', locale)) || t.about.fallback;

  return (
    <div className="container-x max-w-3xl py-14 lg:py-24">
      <p className="eyebrow mb-3">{t.about.eyebrow}</p>
      <h1 className="display text-5xl sm:text-6xl">{t.about.title}</h1>
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-soft">
        {about.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>
      <Link href="/book" className="btn-primary mt-10">
        {t.nav.book}
      </Link>
    </div>
  );
}
