import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <main className="container-x flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-5xl">{t.common.notFound}</h1>
      <p className="mt-4 text-ink-soft">{t.common.notFoundText}</p>
      <Link href="/" className="btn-primary mt-8">
        {t.common.goHome}
      </Link>
    </main>
  );
}
