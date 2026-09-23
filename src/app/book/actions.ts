'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import { EVENT_TYPES, type ActionState } from '@/lib/types';
import { str } from '@/lib/utils';

export async function submitBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getDictionary();
  const supabase = await createClient();

  // Server-side checks (the RPC re-checks both in the database).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/book');
  if (!user.email_confirmed_at) return { error: t.auth.emailNotConfirmed };

  const today = new Date().toISOString().slice(0, 10);
  const schema = z.object({
    event_type: z.enum(EVENT_TYPES),
    event_date: z.iso.date().refine((d) => d >= today, { message: t.booking.futureDate }),
    venue: z.string().min(1, t.auth.required).max(200),
    guest_count: z.union([z.literal(''), z.coerce.number().int().min(1).max(10000)]),
    contact_name: z.string().min(1, t.auth.required).max(120),
    contact_phone: z.string().min(5, t.auth.required).max(30),
    notes: z.string().max(2000),
    service_ids: z.array(z.uuid()).max(20),
  });

  const parsed = schema.safeParse({
    event_type: str(formData, 'event_type'),
    event_date: str(formData, 'event_date'),
    venue: str(formData, 'venue'),
    guest_count: str(formData, 'guest_count'),
    contact_name: str(formData, 'contact_name'),
    contact_phone: str(formData, 'contact_phone'),
    notes: str(formData, 'notes'),
    service_ids: formData.getAll('service_ids').filter((v): v is string => typeof v === 'string'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message.length < 80 ? issue.message : t.auth.required;
    }
    return { fieldErrors };
  }

  const v = parsed.data;
  const { data: bookingId, error } = await supabase.rpc('submit_booking', {
    p_event_type: v.event_type,
    p_event_date: v.event_date,
    p_venue: v.venue,
    p_guest_count: v.guest_count === '' ? null : v.guest_count,
    p_contact_name: v.contact_name,
    p_contact_phone: v.contact_phone,
    p_notes: v.notes,
    p_service_ids: v.service_ids,
  });

  if (error || !bookingId) {
    console.error('submit_booking', error?.message);
    if (error?.code === '22023') return { fieldErrors: { event_date: t.booking.futureDate } };
    if (error?.code === '42501') return { error: t.auth.emailNotConfirmed };
    if (error?.code === '54000') return { error: error.message };
    return { error: t.common.somethingWrong };
  }

  revalidatePath('/account');
  redirect(`/book/sent?id=${bookingId}`);
}
