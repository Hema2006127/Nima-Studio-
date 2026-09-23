'use client';

import { useActionState } from 'react';
import { saveService } from './actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import type { Service } from '@/lib/types';

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action] = useActionState(saveService, null);
  return (
    <form action={action} className="card max-w-3xl space-y-5 p-6 sm:p-8" noValidate>
      {service && <input type="hidden" name="id" value={service.id} />}
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title_en">
            Title (English)
          </label>
          <input id="title_en" name="title_en" defaultValue={service?.title_en} required maxLength={120} className="input" />
          <FieldError state={state} name="title_en" />
        </div>
        <div>
          <label className="label" htmlFor="title_ar">
            Title (Arabic)
          </label>
          <input id="title_ar" name="title_ar" defaultValue={service?.title_ar} maxLength={120} dir="rtl" className="input" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="description_en">
            Description (English)
          </label>
          <textarea id="description_en" name="description_en" defaultValue={service?.description_en} rows={3} maxLength={2000} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="description_ar">
            Description (Arabic)
          </label>
          <textarea id="description_ar" name="description_ar" defaultValue={service?.description_ar} rows={3} maxLength={2000} dir="rtl" className="input" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="slug">
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={service?.slug} required maxLength={80} placeholder="wedding-film" className="input" />
          <FieldError state={state} name="slug" />
        </div>
        <div>
          <label className="label" htmlFor="price_from">
            Price from
          </label>
          <input id="price_from" name="price_from" type="number" min={0} step="1" defaultValue={service?.price_from ?? ''} className="input" />
          <FieldError state={state} name="price_from" />
        </div>
        <div>
          <label className="label" htmlFor="currency">
            Currency
          </label>
          <input id="currency" name="currency" defaultValue={service?.currency ?? 'EGP'} maxLength={3} className="input uppercase" />
          <FieldError state={state} name="currency" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="label" htmlFor="sort_order">
            Display order
          </label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={service?.sort_order ?? 0} className="input" />
        </div>
        <label className="flex items-center gap-2 pb-3 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={service?.is_published ?? true} /> Published
        </label>
      </div>
      <SubmitButton pendingText="Saving…">Save service</SubmitButton>
    </form>
  );
}
