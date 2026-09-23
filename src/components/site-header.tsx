import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { getUser, isAdmin } from '@/lib/auth';
import { localized } from '@/lib/utils';
import { LocaleToggle, ThemeToggle } from './preference-toggles';
import { MobileMenu, NavLinks } from './site-nav';

export async function SiteHeader() {
  const [{ locale, t }, settings, user] = await Promise.all([getDictionary(), getSiteSettings(), getUser()]);
  const admin = user ? await isAdmin() : false;
  const studioName = settings ? localized(settings, 'studio_name', locale) : '';

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/portfolio', label: t.nav.portfolio },
    { href: '/services', label: t.nav.services },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];
  const accountHref = admin ? '/admin' : '/account';
  const accountLabel = admin ? t.nav.admin : t.nav.account;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl text-ink">
          {studioName}
        </Link>

        <NavLinks links={links} className="hidden items-center gap-8 lg:flex" />

        <div className="hidden items-center gap-4 lg:flex">
          <LocaleToggle locale={locale} />
          <ThemeToggle label={t.nav.toggleTheme} />
          <Link href={accountHref} className="text-sm text-ink hover:text-accent">
            {accountLabel}
          </Link>
          <Link href="/book" className="btn-primary !py-2.5">
            {t.nav.book}
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <LocaleToggle locale={locale} />
          <MobileMenu
            links={[...links, { href: accountHref, label: accountLabel }]}
            bookLabel={t.nav.book}
            menuLabel={t.nav.menu}
            closeLabel={t.nav.close}
            themeToggle={<ThemeToggle label={t.nav.toggleTheme} />}
          />
        </div>
      </div>
    </header>
  );
}
