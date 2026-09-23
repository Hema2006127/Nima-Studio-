import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/server';
import { getUser } from '@/lib/auth';
import { safeNext } from '@/lib/utils';
import { AuthPanel } from '@/components/auth-panel';
import { MinimalHeader } from '@/components/minimal-header';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.auth.login };
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const [{ t }, user] = await Promise.all([getDictionary(), getUser()]);
  if (user) redirect(next);

  return (
    <>
      <MinimalHeader />
      <main className="container-x flex justify-center py-14">
        <div className="w-full max-w-md">
          <AuthPanel
            t={t}
            next={next}
            title={t.auth.loginTitle}
            text={t.auth.loginText}
            initialError={params.error === 'link' ? t.auth.linkInvalid : undefined}
          />
        </div>
      </main>
    </>
  );
}
