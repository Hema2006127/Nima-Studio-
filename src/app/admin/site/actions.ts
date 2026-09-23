'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { parseVideoUrl } from '@/lib/video';
import { str, toInternationalPhone } from '@/lib/utils';
import type { ActionState } from '@/lib/types';

const text = (max: number) => z.string().max(max);

/**
 * Accepts any Instagram profile link as copied from the app (with or without
 * https/www, share/tracking parameters) and returns a clean canonical URL.
 * Returns the input unchanged when it isn't an Instagram link so validation reports it.
 */
function normalizeInstagramUrl(input: string): string {
  if (!input) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
    if (host !== 'instagram.com') return input;
    const path = url.pathname.replace(/\/+$/, '');
    return path ? `https://www.instagram.com${path}` : input;
  } catch {
    return input;
  }
}

const schema = z.object({
  studio_name_en: z.string().min(1, 'Required.').max(80),
  studio_name_ar: z.string().min(1, 'Required.').max(80),
  tagline_en: text(120),
  tagline_ar: text(120),
  hero_title_en: z.string().min(1, 'Required.').max(200),
  hero_title_ar: z.string().min(1, 'Required.').max(200),
  hero_subtitle_en: text(400),
  hero_subtitle_ar: text(400),
  about_en: text(5000),
  about_ar: text(5000),
  city_en: text(80),
  city_ar: text(80),
  phone: text(30),
  email: z.union([z.literal(''), z.email('Enter a valid email.')]),
  whatsapp_number: z.union([z.literal(''), z.string().regex(/^[0-9]{8,15}$/, 'Enter a valid WhatsApp number, e.g. 01001234567 or 201001234567.')]),
  instagram_url: z.union([z.literal(''), z.string().regex(/^https:\/\/www\.instagram\.com\/[A-Za-z0-9._/]+$/, 'Paste your Instagram profile link, e.g. https://instagram.com/yourstudio')]),
});

export async function saveSiteSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const raw = Object.fromEntries(Object.keys(schema.shape).map((k) => [k, str(formData, k)]));
  raw.whatsapp_number = raw.whatsapp_number ? toInternationalPhone(raw.whatsapp_number) : '';
  raw.instagram_url = normalizeInstagramUrl(raw.instagram_url);
  const parsed = schema.safeParse(raw);

  const fieldErrors: Record<string, string> = {};
  const showreelInput = str(formData, 'showreel_url');
  const showreel = showreelInput ? parseVideoUrl(showreelInput) : null;
  if (showreelInput && !showreel) fieldErrors.showreel_url = 'This is not a valid YouTube or Google Drive video link.';
  if (!parsed.success) for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  if (!parsed.success || Object.keys(fieldErrors).length) return { fieldErrors, error: 'Please fix the highlighted fields.' };

  const nullable = (v: string) => v || null;
  const supabase = await createClient();
  const { error } = await supabase
    .from('site_settings')
    .update({
      ...parsed.data,
      phone: nullable(parsed.data.phone),
      email: nullable(parsed.data.email),
      whatsapp_number: nullable(parsed.data.whatsapp_number),
      instagram_url: nullable(parsed.data.instagram_url),
      showreel_video_id: showreel?.id ?? null,
      showreel_provider: showreel?.provider ?? 'youtube',
    })
    .eq('id', 1);
  if (error) return { error: `Could not save: ${error.message}` };

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Site content saved.' };
}
