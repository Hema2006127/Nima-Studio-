import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, dictionaries, LOCALES, type Locale } from './dictionaries';

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get('locale')?.value;
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : DEFAULT_LOCALE;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

export async function getTheme(): Promise<'light' | 'dark' | null> {
  const value = (await cookies()).get('theme')?.value;
  return value === 'light' || value === 'dark' ? value : null;
}
