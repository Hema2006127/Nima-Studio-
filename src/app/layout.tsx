import type { Metadata } from 'next';
import { Aref_Ruqaa, Cormorant_Garamond, IBM_Plex_Sans_Arabic, Jost } from 'next/font/google';
import { getLocale, getTheme } from '@/lib/i18n/server';
import { getSiteSettings } from '@/lib/data';
import { localized } from '@/lib/utils';
import { siteUrl } from '@/lib/site-url';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-cormorant' });
const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-jost' });
const aref = Aref_Ruqaa({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-aref' });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['300', '400', '500'], variable: '--font-plex-arabic' });

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const name = settings ? localized(settings, 'studio_name', locale) : 'Wedding Studio';
  const tagline = settings ? localized(settings, 'tagline', locale) : '';
  const title = tagline ? `${name} — ${tagline}` : name;
  const description = settings ? localized(settings, 'hero_subtitle', locale) : undefined;
  // Link previews (WhatsApp, Instagram, Facebook) show the studio logo.
  const image = '/og.jpg';
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${name}` },
    description,
    openGraph: {
      type: 'website',
      siteName: name,
      title,
      description,
      locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-theme={theme ?? undefined}
      // Browser extensions (and the theme toggle) modify <html> attributes before hydration.
      suppressHydrationWarning
      className={`${cormorant.variable} ${jost.variable} ${aref.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
