'use client';

import { useActionState } from 'react';
import { logout, resendVerification } from '@/app/auth/actions';
import { FormMessage, SubmitButton } from '@/components/form';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function VerifyNotice({ t, text }: { t: Dictionary; text: string }) {
  const [state, action] = useActionState(resendVerification, null);
  return (
    <div className="card p-6 sm:p-10">
      <h2 className="font-display text-3xl">{t.auth.notVerifiedTitle}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{text}</p>
      <div className="mt-6 space-y-4">
        <FormMessage state={state} />
        <div className="flex flex-wrap gap-3">
          <form action={action}>
            <input type="hidden" name="next" value="/book" />
            <SubmitButton className="btn-primary" pendingText={t.common.loading}>
              {t.auth.resend}
            </SubmitButton>
          </form>
          <form action={logout}>
            <button type="submit" className="btn-ghost">
              {t.auth.logout}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
