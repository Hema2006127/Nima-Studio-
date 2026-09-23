'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { str } from '@/lib/utils';
import type { ActionState } from '@/lib/types';

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes (e.g. wedding-film).').max(80),
  title_en: z.string().min(1, 'English title is required.').max(120),
  title_ar: z.string().max(120),
  description_en: z.string().max(2000),
  description_ar: z.string().max(2000),
  price_from: z.union([z.literal(''), z.coerce.number().min(0, 'Price cannot be negative.').max(100_000_000)]),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code.'),
  sort_order: z.coerce.number().int(),
  is_published: z.boolean(),
});

function parse(formData: FormData) {
  return schema.safeParse({
    slug: str(formData, 'slug').toLowerCase(),
    title_en: str(formData, 'title_en'),
    title_ar: str(formData, 'title_ar'),
    description_en: str(formData, 'description_en'),
    description_ar: str(formData, 'description_ar'),
    price_from: str(formData, 'price_from'),
    currency: str(formData, 'currency').toUpperCase() || 'EGP',
    sort_order: str(formData, 'sort_order') || '0',
    is_published: formData.get('is_published') === 'on',
  });
}

function errors(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { fieldErrors, error: 'Please fix the highlighted fields.' };
}

export async function saveService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = parse(formData);
  if (!parsed.success) return errors(parsed.error);
  const values = { ...parsed.data, price_from: parsed.data.price_from === '' ? null : parsed.data.price_from };

  const supabase = await createClient();
  const id = str(formData, 'id');
  if (id && !z.uuid().safeParse(id).success) return { error: 'Invalid service.' };
  const { error } = id
    ? await supabase.from('services').update(values).eq('id', id)
    : await supabase.from('services').insert(values);

  if (error) {
    if (error.code === '23505') return { fieldErrors: { slug: 'This slug is already used.' } };
    return { error: `Could not save: ${error.message}` };
  }

  revalidatePath('/', 'layout');
  redirect('/admin/services?saved=1');
}

export async function deleteService(formData: FormData) {
  const auth = await assertAdmin();
  if (!auth.ok) throw new Error(auth.error);
  const id = z.uuid().parse(str(formData, 'id'));

  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  // 23503: referenced by existing bookings — unpublish instead of deleting.
  if (error?.code === '23503') redirect(`/admin/services/${id}?in_use=1`);
  if (error) throw new Error(error.message);

  revalidatePath('/', 'layout');
  redirect('/admin/services?deleted=1');
}
