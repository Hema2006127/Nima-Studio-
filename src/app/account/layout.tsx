import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { localized } from '@/lib/utils';
import { logout } from '@/app/auth/actions';
import { LocaleToggle, ThemeToggle } from '@/components/preference-toggles';
import { SideNav } from '@/components/side-nav';
import type { Profile } from '@/lib/types';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/account');
  const supabase = await createClient();
  const [{ locale, t }, settings, { data: profile }] = await Promise.all([
    getDictionary(),
    getSiteSettings(),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>(),
  ]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="flex flex-col border-b border-line p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-e">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-start">
          <Link href="/" className="font-display text-2xl leading-tight">
            {settings ? localized(settings, 'studio_name', locale) : ''}
          </Link>
          <div className="flex items-center gap-3">
            <LocaleToggle locale={locale} />
            <ThemeToggle label={t.nav.toggleTheme} />
          </div>
        </div>
        <SideNav
          className="mt-6 flex gap-1 overflow-x-auto lg:mt-10 lg:flex-col"
          links={[
            { href: '/account', label: t.account.myBookings, exact: true },
            { href: '/account/profile', label: t.account.profile },
            { href: '/book', label: t.account.newBooking },
            { href: '/', label: t.common.backToWebsite },
          ]}
        />
        <div className="mt-4 border-t border-line pt-4 lg:mt-auto lg:pt-5">
          <p className="text-sm font-medium">{profile?.full_name || '—'}</p>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
          <form action={logout} className="mt-4">
            <button type="submit" className="text-sm underline underline-offset-4">
              {t.auth.logout}
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:p-12">{children}</main>
    </div>
  );
}
