'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { str } from '@/lib/utils';
import { BOOKING_STATUSES, PAYMENT_METHODS, QUOTATION_STATUSES, type ActionState } from '@/lib/types';

function refresh(bookingId: string) {
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath('/admin', 'layout');
  revalidatePath('/account');
}

export async function updateBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = z
    .object({ id: z.uuid(), status: z.enum(BOOKING_STATUSES), admin_notes: z.string().max(5000) })
    .safeParse({ id: str(formData, 'id'), status: str(formData, 'status'), admin_notes: str(formData, 'admin_notes') });
  if (!parsed.success) return { error: 'Invalid booking update.' };

  const supabase = await createClient();
  const { id, ...values } = parsed.data;
  const { error } = await supabase.from('bookings').update(values).eq('id', id);
  if (error) return { error: `Could not save: ${error.message}` };

  refresh(id);
  return { ok: true, message: 'Booking updated.' };
}

export async function saveQuotation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const descriptions = formData.getAll('item_description').map((v) => String(v).trim());
  const amounts = formData.getAll('item_amount').map((v) => String(v).trim());
  const items = descriptions
    .map((description, i) => ({ description, amount: amounts[i] ?? '' }))
    .filter((i) => i.description || i.amount);

  const parsed = z
    .object({
      booking_id: z.uuid(),
      quotation_id: z.union([z.literal(''), z.uuid()]),
      valid_until: z.union([z.literal(''), z.iso.date()]),
      notes: z.string().max(4000),
      currency: z.string().regex(/^[A-Z]{3}$/),
      items: z
        .array(z.object({ description: z.string().min(1).max(200), amount: z.coerce.number().min(0).max(100_000_000) }))
        .min(1)
        .max(50),
    })
    .safeParse({
      booking_id: str(formData, 'booking_id'),
      quotation_id: str(formData, 'quotation_id'),
      valid_until: str(formData, 'valid_until'),
      notes: str(formData, 'notes'),
      currency: (str(formData, 'currency') || 'EGP').toUpperCase(),
      items,
    });
  if (!parsed.success) return { error: 'Add at least one line item with a description and a valid amount.' };

  const v = parsed.data;
  const send = formData.get('intent') === 'send';
  const supabase = await createClient();
  const { error } = await supabase.rpc('save_quotation', {
    p_booking_id: v.booking_id,
    p_quotation_id: v.quotation_id || null,
    p_valid_until: v.valid_until || null,
    p_notes: v.notes,
    p_currency: v.currency,
    p_items: v.items,
    p_send: send,
  });
  if (error) return { error: `Could not save quotation: ${error.message}` };

  refresh(v.booking_id);
  return { ok: true, message: send ? 'Quotation sent — the customer can now see it in their account.' : 'Draft saved.' };
}

export async function setQuotationStatus(formData: FormData) {
  const auth = await assertAdmin();
  if (!auth.ok) throw new Error(auth.error);
  const v = z
    .object({ id: z.uuid(), booking_id: z.uuid(), status: z.enum(QUOTATION_STATUSES) })
    .parse({ id: str(formData, 'id'), booking_id: str(formData, 'booking_id'), status: str(formData, 'status') });

  const supabase = await createClient();
  const { error } = await supabase.from('quotations').update({ status: v.status }).eq('id', v.id).eq('booking_id', v.booking_id);
  if (error) throw new Error(error.message);
  refresh(v.booking_id);
}

export async function recordPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = z
    .object({
      booking_id: z.uuid(),
      amount: z.coerce.number().positive('Amount must be greater than zero.').max(100_000_000),
      currency: z.string().regex(/^[A-Z]{3}$/),
      method: z.enum(PAYMENT_METHODS),
      paid_at: z.iso.date(),
      reference: z.string().max(200),
      notes: z.string().max(2000),
    })
    .safeParse({
      booking_id: str(formData, 'booking_id'),
      amount: str(formData, 'amount'),
      currency: (str(formData, 'currency') || 'EGP').toUpperCase(),
      method: str(formData, 'method'),
      paid_at: str(formData, 'paid_at'),
      reference: str(formData, 'reference'),
      notes: str(formData, 'notes'),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid payment.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('payments').insert({ ...parsed.data, recorded_by: user?.id });
  if (error) return { error: `Could not record payment: ${error.message}` };

  if (formData.get('confirm_booking') === 'on') {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', parsed.data.booking_id).in('status', ['pending', 'quoted']);
  }

  refresh(parsed.data.booking_id);
  return { ok: true, message: 'Payment recorded.' };
}

export async function deletePayment(formData: FormData) {
  const auth = await assertAdmin();
  if (!auth.ok) throw new Error(auth.error);
  const [id, bookingId] = str(formData, 'id').split(':');
  z.uuid().parse(id);
  z.uuid().parse(bookingId);

  const supabase = await createClient();
  const { error } = await supabase.from('payments').delete().eq('id', id).eq('booking_id', bookingId);
  if (error) throw new Error(error.message);
  refresh(bookingId);
}
