'use client';

import { useActionState, useState } from 'react';
import { recordPayment, saveQuotation, updateBooking } from './actions';
import { FormMessage, SubmitButton } from '@/components/form';
import { BOOKING_STATUSES, PAYMENT_METHODS, type Booking, type Quotation } from '@/lib/types';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  instapay: 'InstaPay',
  vodafone_cash: 'Vodafone Cash',
  card: 'Card',
  other: 'Other',
};

export function BookingStatusForm({ booking }: { booking: Booking }) {
  const [state, action] = useActionState(updateBooking, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={booking.id} />
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={booking.status} className="input">
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="admin_notes">
          Internal notes <span className="font-normal text-ink-soft">(never shown to the customer)</span>
        </label>
        <textarea id="admin_notes" name="admin_notes" defaultValue={booking.admin_notes} rows={4} className="input" />
      </div>
      <SubmitButton className="btn-outline" pendingText="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}

type Row = { key: number; description: string; amount: string };

export function QuotationForm({ bookingId, quotation }: { bookingId: string; quotation: Quotation | null }) {
  const [state, action] = useActionState(saveQuotation, null);
  const initial: Row[] = (quotation?.quotation_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i, idx) => ({ key: idx, description: i.description, amount: String(i.amount) }));
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : [{ key: 0, description: '', amount: '' }]);
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="quotation_id" value={quotation?.id ?? ''} />
      <FormMessage state={state} />

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex gap-2">
            <input
              name="item_description"
              value={r.description}
              onChange={(e) => update(r.key, { description: e.target.value })}
              placeholder="e.g. Wedding film — full day"
              maxLength={200}
              className="input flex-1"
              aria-label="Item description"
            />
            <input
              name="item_amount"
              value={r.amount}
              onChange={(e) => update(r.key, { amount: e.target.value })}
              type="number"
              min={0}
              step="1"
              placeholder="Amount"
              className="input w-32"
              aria-label="Amount"
            />
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
              aria-label="Remove line"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm underline underline-offset-4"
          onClick={() => setRows((rs) => [...rs, { key: Math.max(-1, ...rs.map((x) => x.key)) + 1, description: '', amount: '' }])}
        >
          + Add line
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="currency">
            Currency
          </label>
          <input id="currency" name="currency" defaultValue={quotation?.currency ?? 'EGP'} maxLength={3} className="input uppercase" />
        </div>
        <div>
          <label className="label" htmlFor="valid_until">
            Valid until
          </label>
          <input id="valid_until" name="valid_until" type="date" defaultValue={quotation?.valid_until ?? ''} className="input" />
        </div>
        <div className="flex items-end justify-end pb-2.5 text-lg font-medium">Total: {total.toLocaleString('en-EG')}</div>
      </div>
      <div>
        <label className="label" htmlFor="q_notes">
          Notes for the customer <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <textarea id="q_notes" name="notes" defaultValue={quotation?.notes} rows={3} maxLength={4000} className="input" />
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton name="intent" value="send" pendingText="Saving…">
          {quotation?.status === 'sent' ? 'Save & update customer' : 'Save & send to customer'}
        </SubmitButton>
        {quotation?.status !== 'sent' && (
          <SubmitButton name="intent" value="draft" className="btn-outline" pendingText="Saving…">
            Save as draft
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

export function PaymentForm({ bookingId, currency, canConfirm }: { bookingId: string; currency: string; canConfirm: boolean }) {
  const [state, action] = useActionState(recordPayment, null);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="currency" value={currency} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="amount">
            Amount ({currency})
          </label>
          <input id="amount" name="amount" type="number" min={1} step="1" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="method">
            Method
          </label>
          <select id="method" name="method" className="input" defaultValue="cash">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="paid_at">
            Date
          </label>
          <input id="paid_at" name="paid_at" type="date" defaultValue={today} required className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reference">
            Reference <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input id="reference" name="reference" maxLength={200} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="p_notes">
            Notes <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input id="p_notes" name="notes" maxLength={2000} className="input" />
        </div>
      </div>
      {canConfirm && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm_booking" defaultChecked /> Mark booking as confirmed (deposit received)
        </label>
      )}
      <SubmitButton pendingText="Saving…">Record payment</SubmitButton>
    </form>
  );
}
