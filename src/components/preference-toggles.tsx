'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { MoonIcon, SunIcon } from './icons';
import type { Locale } from '@/lib/i18n/dictionaries';

const ONE_YEAR = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    setCookie('locale', next);
    startTransition(() => router.refresh());
  };

  return (
    <div className={`flex items-center gap-1.5 text-xs ${pending ? 'opacity-60' : ''}`}>
      <button type="button" onClick={() => choose('en')} className={locale === 'en' ? 'font-semibold text-ink' : 'text-ink-soft hover:text-ink'} lang="en">
        EN
      </button>
      <span className="text-ink-soft">·</span>
      <button type="button" onClick={() => choose('ar')} className={locale === 'ar' ? 'font-semibold text-ink' : 'text-ink-soft hover:text-ink'} lang="ar">
        عربي
      </button>
    </div>
  );
}

export function ThemeToggle({ label }: { label: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    setCookie('theme', next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:bg-ink/5"
    >
      <MoonIcon size={15} className="block [html[data-theme=dark]_&]:hidden" />
      <SunIcon size={15} className="hidden [html[data-theme=dark]_&]:block" />
    </button>
  );
}
