'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { validateImage } from '@/lib/images';
import { parseVideoUrl } from '@/lib/video';
import { str } from '@/lib/utils';
import { PORTFOLIO_CATEGORIES, type ActionState } from '@/lib/types';

const BUCKET = 'portfolio';

const schema = z.object({
  title: z.string().min(1, 'Title is required.').max(160),
  title_ar: z.string().max(160),
  description: z.string().max(4000),
  description_ar: z.string().max(4000),
  category: z.enum(PORTFOLIO_CATEGORIES, { message: 'Choose a category.' }),
  venue: z.string().max(200),
  event_date: z.union([z.literal(''), z.iso.date()]),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
  is_published: z.boolean(),
  is_featured: z.boolean(),
});

function revalidatePortfolio() {
  revalidatePath('/', 'layout');
}

async function uploadCover(file: File): Promise<{ path: string } | { error: string }> {
  const checked = await validateImage(file);
  if (!checked.ok) return { error: checked.error };
  const path = `covers/${crypto.randomUUID()}.${checked.ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, checked.body, {
    contentType: checked.contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) return { error: `Upload failed: ${error.message}` };
  return { path };
}

async function removeCover(path: string | null | undefined) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

function parseForm(formData: FormData) {
  const videoInput = str(formData, 'video_url');
  const video = parseVideoUrl(videoInput);
  const parsed = schema.safeParse({
    title: str(formData, 'title'),
    title_ar: str(formData, 'title_ar'),
    description: str(formData, 'description'),
    description_ar: str(formData, 'description_ar'),
    category: str(formData, 'category'),
    venue: str(formData, 'venue'),
    event_date: str(formData, 'event_date'),
    sort_order: str(formData, 'sort_order') || '0',
    is_published: formData.get('is_published') === 'on',
    is_featured: formData.get('is_featured') === 'on',
  });

  const fieldErrors: Record<string, string> = {};
  if (!videoInput) fieldErrors.video_url = 'Paste a YouTube or Google Drive link.';
  else if (!video) fieldErrors.video_url = 'This is not a valid YouTube or Google Drive video link.';
  if (!parsed.success) {
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  }
  if (!parsed.success || !video) return { fieldErrors } as const;

  const { event_date, ...rest } = parsed.data;
  return { values: { ...rest, event_date: event_date || null, video_provider: video.provider, video_id: video.id } } as const;
}

function coverFile(formData: FormData): File | null {
  const f = formData.get('cover');
  return f instanceof File && f.size > 0 ? f : null;
}

export async function createPortfolioItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = parseForm(formData);
  if ('fieldErrors' in parsed) return { fieldErrors: parsed.fieldErrors, error: 'Please fix the highlighted fields.' };

  let coverPath: string | null = null;
  const file = coverFile(formData);
  if (file) {
    const up = await uploadCover(file);
    if ('error' in up) return { fieldErrors: { cover: up.error } };
    coverPath = up.path;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_items').insert({ ...parsed.values, cover_image_path: coverPath });
  if (error) {
    await removeCover(coverPath);
    return { error: `Could not save: ${error.message}` };
  }

  revalidatePortfolio();
  if (formData.get('stay') === '1') return { ok: true, message: 'Film saved.' };
  redirect('/admin/portfolio?saved=1');
}

export async function updatePortfolioItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const id = z.uuid().safeParse(str(formData, 'id'));
  if (!id.success) return { error: 'Invalid item.' };

  const parsed = parseForm(formData);
  if ('fieldErrors' in parsed) return { fieldErrors: parsed.fieldErrors, error: 'Please fix the highlighted fields.' };

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from('portfolio_items')
    .select('cover_image_path')
    .eq('id', id.data)
    .maybeSingle<{ cover_image_path: string | null }>();
  if (loadError || !existing) return { error: 'Item not found.' };

  let coverPath = existing.cover_image_path;
  let uploaded: string | null = null;
  const file = coverFile(formData);
  if (file) {
    const up = await uploadCover(file);
    if ('error' in up) return { fieldErrors: { cover: up.error } };
    coverPath = uploaded = up.path;
  } else if (formData.get('remove_cover') === 'on') {
    coverPath = null;
  }

  const { error } = await supabase
    .from('portfolio_items')
    .update({ ...parsed.values, cover_image_path: coverPath })
    .eq('id', id.data);
  if (error) {
    await removeCover(uploaded);
    return { error: `Could not save: ${error.message}` };
  }
  if (existing.cover_image_path && existing.cover_image_path !== coverPath) await removeCover(existing.cover_image_path);

  revalidatePortfolio();
  return { ok: true, message: 'Changes saved.' };
}

export async function deletePortfolioItem(formData: FormData) {
  const auth = await assertAdmin();
  if (!auth.ok) throw new Error(auth.error);
  const id = z.uuid().parse(str(formData, 'id'));

  const supabase = await createClient();
  const { data } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id)
    .select('cover_image_path')
    .maybeSingle<{ cover_image_path: string | null }>();
  await removeCover(data?.cover_image_path);

  revalidatePortfolio();
  redirect('/admin/portfolio?deleted=1');
}

export async function setPortfolioPublished(formData: FormData) {
  const auth = await assertAdmin();
  if (!auth.ok) throw new Error(auth.error);
  const id = z.uuid().parse(str(formData, 'id'));
  const publish = formData.get('publish') === '1';

  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_items').update({ is_published: publish }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePortfolio();
}

/** Moves an item one step up/down by rewriting sort_order in steps of 10. */
export async function movePortfolioItem(formData: FormData) {
  const auth = await assertAdmin();
  if (!auth.ok) throw new Error(auth.error);
  const id = z.uuid().parse(str(formData, 'id'));
  const direction = formData.get('direction') === 'up' ? -1 : 1;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('id, sort_order')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error || !data) throw new Error(error?.message ?? 'Could not load items');

  const ids = data.map((r) => r.id as string);
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];

  const updates = ids
    .map((itemId, i) => ({ id: itemId, sort_order: (i + 1) * 10 }))
    .filter((u) => data.find((r) => r.id === u.id)?.sort_order !== u.sort_order);
  for (const u of updates) {
    const { error: e } = await supabase.from('portfolio_items').update({ sort_order: u.sort_order }).eq('id', u.id);
    if (e) throw new Error(e.message);
  }
  revalidatePortfolio();
}
