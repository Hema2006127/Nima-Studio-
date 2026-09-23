import type { Locale } from '@/lib/i18n/dictionaries';

/** Picks the Arabic variant of a bilingual field when available, else English. */
export function localized<T extends object>(row: T, field: string, locale: Locale): string {
  const r = row as Record<string, unknown>;
  const ar = r[`${field}_ar`];
  const en = r[`${field}_en`] ?? r[field];
  if (locale === 'ar' && typeof ar === 'string' && ar.trim()) return ar;
  return typeof en === 'string' ? en : '';
}

export function formatMoney(amount: number | string | null | undefined, currency = 'EGP', locale: Locale = 'en'): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string | null | undefined, locale: Locale = 'en', opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return '';
  // Date-only values ("2026-10-01") are parsed as UTC to avoid off-by-one shifts.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...opts,
  }).format(date);
}

export function formatMonthYear(value: string | null | undefined, locale: Locale = 'en'): string {
  return formatDate(value, locale, { day: undefined, month: 'long', year: 'numeric' });
}

/** Only allow same-site relative redirect targets (prevents open redirects). */
export function safeNext(next: unknown, fallback = '/account'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

/**
 * Normalises a phone number to the international digits wa.me expects.
 * Egyptian local numbers (01xxxxxxxxx) get the 20 country code; a leading 00 is dropped.
 */
export function toInternationalPhone(number: string): string {
  let digits = number.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^01\d{9}$/.test(digits)) digits = `2${digits}`;
  return digits;
}

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  const digits = toInternationalPhone(number);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
