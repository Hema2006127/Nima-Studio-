'use client';

import { useActionState } from 'react';
import { requestPasswordReset, updatePassword } from './actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function ForgotPasswordForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className="label">
          {t.auth.email}
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" dir="ltr" />
        <FieldError state={state} name="email" />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText={t.common.loading}>
        {t.auth.sendReset}
      </SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="password" className="label">
          {t.auth.newPassword}
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" dir="ltr" />
        <FieldError state={state} name="password" />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText={t.common.saving}>
        {t.auth.updatePassword}
      </SubmitButton>
    </form>
  );
}
