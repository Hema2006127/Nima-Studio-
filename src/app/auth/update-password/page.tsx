import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';
import { getUser } from '@/lib/auth';
import { MinimalHeader } from '@/components/minimal-header';
import { UpdatePasswordForm } from '../password-forms';

export default async function UpdatePasswordPage() {
  const [{ t }, user] = await Promise.all([getDictionary(), getUser()]);
  return (
    <>
      <MinimalHeader />
      <main className="container-x flex justify-center py-14">
        <div className="card w-full max-w-md p-6 sm:p-10">
          <h1 className="font-display text-3xl">{t.auth.newPasswordTitle}</h1>
          {user ? (
            <UpdatePasswordForm t={t} />
          ) : (
            <>
              <p className="mt-3 text-sm text-ink-soft">{t.auth.linkInvalid}</p>
              <Link href="/auth/forgot-password" className="btn-outline mt-6">
                {t.auth.sendReset}
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
