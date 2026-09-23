'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { updateProfile } from '../actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function ProfileForm({ t, email, fullName, phone }: { t: Dictionary; email: string; fullName: string; phone: string }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">
          {t.auth.email}
        </label>
        <input id="email" value={email} disabled readOnly className="input opacity-70" dir="ltr" />
      </div>
      <div>
        <label className="label" htmlFor="full_name">
          {t.auth.fullName}
        </label>
        <input id="full_name" name="full_name" defaultValue={fullName} required maxLength={120} className="input" />
        <FieldError state={state} name="full_name" />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          {t.auth.phone}
        </label>
        <input id="phone" name="phone" type="tel" defaultValue={phone} maxLength={30} className="input" dir="ltr" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubmitButton pendingText={t.common.saving}>{t.common.save}</SubmitButton>
        <Link href="/auth/update-password" className="text-sm underline underline-offset-4">
          {t.auth.newPasswordTitle}
        </Link>
      </div>
    </form>
  );
}
