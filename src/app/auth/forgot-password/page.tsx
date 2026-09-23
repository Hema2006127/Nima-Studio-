import { getDictionary } from '@/lib/i18n/server';
import { MinimalHeader } from '@/components/minimal-header';
import { ForgotPasswordForm } from '../password-forms';

export default async function ForgotPasswordPage() {
  const { t } = await getDictionary();
  return (
    <>
      <MinimalHeader />
      <main className="container-x flex justify-center py-14">
        <div className="card w-full max-w-md p-6 sm:p-10">
          <h1 className="font-display text-3xl">{t.auth.resetTitle}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.auth.resetText}</p>
          <ForgotPasswordForm t={t} />
        </div>
      </main>
    </>
  );
}
