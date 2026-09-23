'use client';

import { useActionState } from 'react';
import { submitBooking } from './actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import { EVENT_TYPES } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface Props {
  t: Dictionary;
  services: Array<{ id: string; title: string; slug: string }>;
  preselectedSlug?: string;
  defaults: { name: string; phone: string };
  minDate: string;
}

export function BookingForm({ t, services, preselectedSlug, defaults, minDate }: Props) {
  const [state, action] = useActionState(submitBooking, null);

  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="event_type" className="label">
            {t.booking.eventType}
          </label>
          <select id="event_type" name="event_type" className="input" defaultValue="wedding">
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.eventTypes[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event_date" className="label">
            {t.booking.eventDate}
          </label>
          <input id="event_date" name="event_date" type="date" min={minDate} required className="input" />
          <FieldError state={state} name="event_date" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
        <div>
          <label htmlFor="venue" className="label">
            {t.booking.venue}
          </label>
          <input id="venue" name="venue" required maxLength={200} className="input" />
          <FieldError state={state} name="venue" />
        </div>
        <div>
          <label htmlFor="guest_count" className="label">
            {t.booking.guests}
          </label>
          <input id="guest_count" name="guest_count" type="number" min={1} max={10000} inputMode="numeric" className="input" />
          <FieldError state={state} name="guest_count" />
        </div>
      </div>

      {services.length > 0 && (
        <fieldset>
          <legend className="label">{t.booking.coverage}</legend>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="service_ids"
                  value={s.id}
                  defaultChecked={s.slug === preselectedSlug}
                  className="peer sr-only"
                />
                <span className="inline-block border border-line px-4 py-2 text-sm text-ink-soft transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  {s.title}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact_name" className="label">
            {t.booking.contactName}
          </label>
          <input id="contact_name" name="contact_name" defaultValue={defaults.name} required maxLength={120} autoComplete="name" className="input" />
          <FieldError state={state} name="contact_name" />
        </div>
        <div>
          <label htmlFor="contact_phone" className="label">
            {t.booking.contactPhone}
          </label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            defaultValue={defaults.phone}
            required
            maxLength={30}
            autoComplete="tel"
            dir="ltr"
            className="input"
          />
          <FieldError state={state} name="contact_phone" />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label">
          {t.booking.notes}
        </label>
        <textarea id="notes" name="notes" rows={4} maxLength={2000} className="input" />
      </div>

      <SubmitButton className="btn-primary w-full" pendingText={t.booking.submitting}>
        {t.booking.submit}
      </SubmitButton>
    </form>
  );
}
