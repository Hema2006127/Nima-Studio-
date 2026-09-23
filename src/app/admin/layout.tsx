import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getSiteSettings } from '@/lib/data';
import { logout } from '@/app/auth/actions';
import { SideNav } from '@/components/side-nav';
import { ThemeToggle } from '@/components/preference-toggles';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: signed in AND listed in public.admins. Every admin
  // server action re-checks with assertAdmin(), and RLS enforces it again.
  const user = await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div dir="ltr" lang="en" className="min-h-screen font-sans lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-b border-line bg-surface p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-e">
        <div className="flex items-start justify-between">
          <Link href="/admin">
            <span className="block font-display text-2xl">{settings?.studio_name_en}</span>
            <span className="eyebrow">Admin</span>
          </Link>
          <ThemeToggle label="Toggle dark mode" />
        </div>
        <SideNav
          className="mt-6 flex gap-1 overflow-x-auto lg:mt-10 lg:flex-col"
          links={[
            { href: '/admin', label: 'Overview', exact: true },
            { href: '/admin/bookings', label: 'Bookings' },
            { href: '/admin/quotations', label: 'Quotations' },
            { href: '/admin/payments', label: 'Payments' },
            { divider: true },
            { href: '/admin/portfolio', label: 'Portfolio' },
            { href: '/admin/services', label: 'Services' },
            { href: '/admin/site', label: 'Site content' },
            { divider: true },
            { href: '/', label: 'View website' },
          ]}
        />
        <div className="mt-4 border-t border-line pt-4 lg:mt-auto">
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <form action={logout} className="mt-2">
            <button type="submit" className="text-sm underline underline-offset-4">
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
