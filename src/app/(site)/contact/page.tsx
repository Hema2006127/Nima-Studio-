import Link from 'next/link';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { localized } from '@/lib/utils';
import { ContactButtons } from '@/components/sections';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.contact };
}

export default async function ContactPage() {
  const [{ locale, t }, settings] = await Promise.all([getDictionary(), getSiteSettings()]);

  const rows = [
    settings?.phone && {
      label: t.contact.phone,
      value: (
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="link">
          <bdi dir="ltr">{settings.phone}</bdi>
        </a>
      ),
    },
    settings?.email && {
      label: t.contact.email,
      value: (
        <a href={`mailto:${settings.email}`} className="link">
          {settings.email}
        </a>
      ),
    },
    settings && { label: t.contact.location, value: localized(settings, 'city', locale) },
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  return (
    <div className="container-x grid gap-12 py-14 lg:grid-cols-2 lg:py-24">
      <div>
        <p className="eyebrow mb-3">{t.contact.eyebrow}</p>
        <h1 className="display text-5xl sm:text-6xl">{t.contact.title}</h1>
        <p className="mt-5 max-w-md leading-relaxed text-ink-soft">{t.contact.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ContactButtons settings={settings} t={t} />
          <Link href="/book" className="btn-primary">
            {t.nav.book}
          </Link>
        </div>
      </div>
      <dl className="card divide-y divide-line self-start">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-6 px-6 py-5">
            <dt className="text-sm text-ink-soft">{r.label}</dt>
            <dd className="text-sm">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
