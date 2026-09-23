'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import { format } from '@/lib/i18n/dictionaries';
import { safeNext, str } from '@/lib/utils';
import type { ActionState } from '@/lib/types';

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function callbackUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const email = str(formData, 'email');
  const password = typeof formData.get('password') === 'string' ? (formData.get('password') as string) : '';
  const next = safeNext(str(formData, 'next'));

  if (!z.email().safeParse(email).success) return { fieldErrors: { email: t.auth.invalidEmail } };
  if (!password) return { fieldErrors: { password: t.auth.required } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'email_not_confirmed') return { error: t.auth.emailNotConfirmed };
    if (error.code === 'invalid_credentials') return { error: t.auth.invalidCredentials };
    return { error: t.common.somethingWrong };
  }
  redirect(next);
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const email = str(formData, 'email');
  const password = typeof formData.get('password') === 'string' ? (formData.get('password') as string) : '';
  const fullName = str(formData, 'full_name').slice(0, 120);
  const phone = str(formData, 'phone').slice(0, 30);
  const next = safeNext(str(formData, 'next'));

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.full_name = t.auth.required;
  if (!z.email().safeParse(email).success) fieldErrors.email = t.auth.invalidEmail;
  if (password.length < 8) fieldErrors.password = t.auth.passwordMin;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(await siteOrigin(), next),
      // Display data only — permissions never come from user_metadata.
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    if (error.code === 'weak_password') return { fieldErrors: { password: t.auth.passwordMin } };
    if (error.code === 'over_email_send_rate_limit') return { error: error.message };
    return { error: t.common.somethingWrong };
  }

  // Email confirmation disabled in the project → user is signed in already.
  if (data.session) redirect(next);

  return { ok: true, message: format(t.auth.checkEmailText, { email }) };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function resendVerification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: t.common.somethingWrong };

  const next = safeNext(str(formData, 'next'), '/book');
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: { emailRedirectTo: callbackUrl(await siteOrigin(), next) },
  });
  if (error) return { error: error.code === 'over_email_send_rate_limit' ? error.message : t.common.somethingWrong };
  return { ok: true, message: t.auth.resent };
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const email = str(formData, 'email');
  if (!z.email().safeParse(email).success) return { fieldErrors: { email: t.auth.invalidEmail } };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(await siteOrigin(), '/auth/update-password'),
  });
  // Same response whether or not the account exists (no user enumeration).
  return { ok: true, message: t.auth.resetSent };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const password = typeof formData.get('password') === 'string' ? (formData.get('password') as string) : '';
  if (password.length < 8) return { fieldErrors: { password: t.auth.passwordMin } };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.auth.linkInvalid };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.code === 'same_password' ? error.message : t.common.somethingWrong };
  return { ok: true, message: t.auth.passwordUpdated };
}
