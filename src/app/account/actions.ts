'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import { str } from '@/lib/utils';
import type { ActionState } from '@/lib/types';

export async function cancelBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const id = z.uuid().safeParse(str(formData, 'booking_id'));
  if (!id.success) return { error: t.common.somethingWrong };

  const supabase = await createClient();
  // Ownership and allowed statuses are enforced inside the RPC.
  const { error } = await supabase.rpc('cancel_booking', { p_booking_id: id.data });
  if (error) return { error: t.common.somethingWrong };

  revalidatePath('/account');
  return { ok: true, message: t.account.cancelled };
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.common.somethingWrong };

  const fullName = str(formData, 'full_name');
  if (!fullName) return { fieldErrors: { full_name: t.auth.required } };

  // Only full_name/phone are updatable by customers (column-level grant + RLS).
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.slice(0, 120), phone: str(formData, 'phone').slice(0, 30) || null })
    .eq('id', user.id);
  if (error) return { error: t.common.somethingWrong };

  revalidatePath('/account', 'layout');
  return { ok: true, message: t.account.profileSaved };
}
