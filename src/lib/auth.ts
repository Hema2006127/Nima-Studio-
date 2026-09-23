import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Returns the verified user (validated with the Auth server) or null. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Admin status comes only from the admins table, never from user_metadata. */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
});

export async function requireUser(next = '/account') {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Use in every admin page AND every admin server action. */
export async function requireAdmin() {
  const user = await requireUser('/admin');
  if (!(await isAdmin())) redirect('/');
  return user;
}

/** For server actions: returns an error result instead of redirecting. */
export async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!(await isAdmin())) return { ok: false, error: 'Admin access required.' };
  return { ok: true };
}
