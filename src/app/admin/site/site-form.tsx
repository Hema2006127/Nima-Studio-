'use client';

import { useActionState } from 'react';
import { saveSiteSettings } from './actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import { videoWatchUrl } from '@/lib/video';
import type { ActionState, SiteSettings } from '@/lib/types';

type Field = { name: keyof SiteSettings | 'showreel_url'; label: string; textarea?: boolean; rtl?: boolean; ltr?: boolean; hint?: string };

const GROUPS: Array<{ title: string; fields: Field[][] }> = [
  {
    title: 'Brand',
    fields: [
      [
        { name: 'studio_name_en', label: 'Studio name (English)' },
        { name: 'studio_name_ar', label: 'Studio name (Arabic)', rtl: true },
      ],
      [
        { name: 'tagline_en', label: 'Tagline (English)' },
        { name: 'tagline_ar', label: 'Tagline (Arabic)', rtl: true },
      ],
    ],
  },
  {
    title: 'Home page hero',
    fields: [
      [
        { name: 'hero_title_en', label: 'Headline (English)', textarea: true },
        { name: 'hero_title_ar', label: 'Headline (Arabic)', textarea: true, rtl: true },
      ],
      [
        { name: 'hero_subtitle_en', label: 'Subtitle (English)', textarea: true },
        { name: 'hero_subtitle_ar', label: 'Subtitle (Arabic)', textarea: true, rtl: true },
      ],
      [{ name: 'showreel_url', label: 'Showreel video link — YouTube or Google Drive', ltr: true, hint: 'Shown in the hero as a vertical reel. YouTube links autoplay muted on page load (use a vertical Short); Google Drive can’t autoplay and needs a tap. Leave empty to hide.' }],
    ],
  },
  {
    title: 'About page',
    fields: [
      [
        { name: 'about_en', label: 'About (English)', textarea: true },
        { name: 'about_ar', label: 'About (Arabic)', textarea: true, rtl: true },
      ],
    ],
  },
  {
    title: 'Contact',
    fields: [
      [
        { name: 'whatsapp_number', label: 'WhatsApp number', ltr: true, hint: 'e.g. 01001234567 — the Egypt code (20) is added automatically' },
        { name: 'instagram_url', label: 'Instagram link', ltr: true },
      ],
      [
        { name: 'phone', label: 'Phone (displayed)', ltr: true },
        { name: 'email', label: 'Email', ltr: true },
      ],
      [
        { name: 'city_en', label: 'City (English)' },
        { name: 'city_ar', label: 'City (Arabic)', rtl: true },
      ],
    ],
  },
];

export function SiteForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState(saveSiteSettings, null);
  const value = (name: Field['name']) =>
    name === 'showreel_url' ? (settings.showreel_video_id ? videoWatchUrl({ provider: settings.showreel_provider, id: settings.showreel_video_id }) : '') : String(settings[name] ?? '');

  return (
    <form action={action} className="max-w-4xl space-y-6" noValidate>
      <FormMessage state={state} />
      {GROUPS.map((group) => (
        <section key={group.title} className="card space-y-5 p-6 sm:p-8">
          <h2 className="text-lg font-medium">{group.title}</h2>
          {group.fields.map((row, i) => (
            <div key={i} className={`grid gap-5 ${row.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {row.map((f) => (
                <FieldInput key={f.name} field={f} defaultValue={value(f.name)} state={state} />
              ))}
            </div>
          ))}
        </section>
      ))}
      <SubmitButton pendingText="Saving…">Save site content</SubmitButton>
    </form>
  );
}

function FieldInput({ field, defaultValue, state }: { field: Field; defaultValue: string; state: ActionState }) {
  const common = {
    id: field.name,
    name: field.name,
    defaultValue,
    className: 'input',
    dir: field.rtl ? 'rtl' : field.ltr ? 'ltr' : undefined,
  } as const;
  return (
    <div>
      <label className="label" htmlFor={field.name}>
        {field.label}
      </label>
      {field.textarea ? <textarea {...common} rows={field.name.startsWith('about') ? 6 : 3} /> : <input {...common} />}
      {field.hint && <p className="mt-1 text-xs text-ink-soft">{field.hint}</p>}
      <FieldError state={state} name={field.name} />
    </div>
  );
}
