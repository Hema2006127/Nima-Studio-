import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { localized } from '@/lib/utils';
import { BackArrowIcon } from './icons';
import { LocaleToggle, ThemeToggle } from './preference-toggles';

/** Focused header used on booking and auth screens. */
export async function MinimalHeader() {
  const [{ locale, t }, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  return (
    <header className="border-b border-line">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-2xl">
          {settings ? localized(settings, 'studio_name', locale) : ''}
        </Link>
        <div className="flex items-center gap-4">
          <LocaleToggle locale={locale} />
          <ThemeToggle label={t.nav.toggleTheme} />
          <Link href="/" className="hidden items-center gap-1.5 text-sm text-ink-soft hover:text-ink sm:inline-flex">
            <BackArrowIcon size={14} /> {t.common.backToWebsite}
          </Link>
        </div>
      </div>
    </header>
  );
}
