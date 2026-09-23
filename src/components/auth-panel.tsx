'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { login, signup } from '@/app/auth/actions';
import { FieldError, FormMessage, SubmitButton } from './form';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function AuthPanel({ t, next, title, text, initialError }: { t: Dictionary; next: string; title: string; text: string; initialError?: string }) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loginState, loginAction] = useActionState(login, initialError ? { error: initialError } : null);
  const [signupState, signupAction] = useActionState(signup, null);

  if (signupState?.ok) {
    return (
      <div className="card p-8 sm:p-10">
        <h2 className="font-display text-3xl">{t.auth.checkEmailTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{signupState.message}</p>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-10">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>

      <div className="mt-6 grid grid-cols-2 border-b border-line text-sm" role="tablist">
        {(['login', 'signup'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 py-3 ${tab === key ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}`}
          >
            {key === 'login' ? t.auth.login : t.auth.createAccount}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <form action={loginAction} className="mt-6 space-y-5" noValidate>
          <input type="hidden" name="next" value={next} />
          <FormMessage state={loginState} />
          <div>
            <label htmlFor="login-email" className="label">
              {t.auth.email}
            </label>
            <input id="login-email" name="email" type="email" autoComplete="email" required className="input" dir="ltr" />
            <FieldError state={loginState} name="email" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="label">
                {t.auth.password}
              </label>
              <Link href="/auth/forgot-password" className="mb-1.5 text-xs text-ink-soft underline">
                {t.auth.forgot}
              </Link>
            </div>
            <input id="login-password" name="password" type="password" autoComplete="current-password" required className="input" dir="ltr" />
            <FieldError state={loginState} name="password" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText={t.common.loading}>
            {t.auth.loginContinue}
          </SubmitButton>
          <p className="text-center text-xs text-ink-soft">{t.auth.backToBooking}</p>
        </form>
      ) : (
        <form action={signupAction} className="mt-6 space-y-5" noValidate>
          <input type="hidden" name="next" value={next} />
          <FormMessage state={signupState} />
          <div>
            <label htmlFor="su-name" className="label">
              {t.auth.fullName}
            </label>
            <input id="su-name" name="full_name" autoComplete="name" required maxLength={120} className="input" />
            <FieldError state={signupState} name="full_name" />
          </div>
          <div>
            <label htmlFor="su-phone" className="label">
              {t.auth.phone}
            </label>
            <input id="su-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="input" dir="ltr" />
          </div>
          <div>
            <label htmlFor="su-email" className="label">
              {t.auth.email}
            </label>
            <input id="su-email" name="email" type="email" autoComplete="email" required className="input" dir="ltr" />
            <FieldError state={signupState} name="email" />
          </div>
          <div>
            <label htmlFor="su-password" className="label">
              {t.auth.password}
            </label>
            <input id="su-password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" dir="ltr" />
            <FieldError state={signupState} name="password" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText={t.common.loading}>
            {t.auth.signupContinue}
          </SubmitButton>
          <p className="text-center text-xs text-ink-soft">{t.auth.backToBooking}</p>
        </form>
      )}
    </div>
  );
}
