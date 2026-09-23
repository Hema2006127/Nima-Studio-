import Link from 'next/link';
import { Logo } from './logo';
import { getDictionary } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { localized } from '@/lib/utils';

export async function SiteFooter() {
  const [{ locale, t }, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  const name = settings ? localized(settings, 'studio_name', locale) : '';

  return (
    <footer className="border-t border-line">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={name} size={48} />
          {settings && (
            <>
              <p className="mt-3 text-sm text-ink-soft">{localized(settings, 'tagline', locale)}</p>
              <p className="text-sm text-ink-soft">{localized(settings, 'city', locale)}</p>
            </>
          )}
        </div>
        <FooterCol title={t.footer.explore}>
          <Link href="/portfolio">{t.nav.portfolio}</Link>
          <Link href="/services">{t.nav.services}</Link>
          <Link href="/about">{t.nav.about}</Link>
          <Link href="/contact">{t.nav.contact}</Link>
        </FooterCol>
        <FooterCol title={t.footer.contact}>
          {settings?.phone && (
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
              <bdi dir="ltr">{settings.phone}</bdi>
            </a>
          )}
          {settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings?.instagram_url && (
            <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer">
              {t.common.instagram}
            </a>
          )}
        </FooterCol>
        <FooterCol title={t.footer.account}>
          <Link href="/account">{t.footer.myBookings}</Link>
          <Link href="/book">{t.footer.bookEvent}</Link>
        </FooterCol>
      </div>
      <div className="container-x">
        <p className="border-t border-line py-6 text-xs text-ink-soft">
          © {new Date().getFullYear()} {name}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex flex-col gap-2 text-sm text-ink-soft [&_a:hover]:text-ink">{children}</div>
    </div>
  );
}
