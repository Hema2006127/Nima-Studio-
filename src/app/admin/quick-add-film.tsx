'use client';

import { useActionState, useState } from 'react';
import { createPortfolioItem } from './portfolio/actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import { parseVideoUrl } from '@/lib/video';
import { PORTFOLIO_CATEGORIES, type ActionState } from '@/lib/types';

export function QuickAddFilm() {
  const [url, setUrl] = useState('');
  const [state, action] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await createPortfolioItem(prev, fd);
    if (result?.ok) setUrl('');
    return result;
  }, null);
  const invalid = url.length > 0 && !parseVideoUrl(url);

  return (
    <section className="card self-start p-6">
      <h2 className="text-lg font-medium">Quick add: film</h2>
      <form action={action} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="stay" value="1" />
        <input type="hidden" name="sort_order" value="0" />
        <FormMessage state={state} />
        <div>
          <label className="label" htmlFor="qa-url">
            YouTube or Google Drive link
          </label>
          <input
            id="qa-url"
            name="video_url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/… or drive.google.com/…"
            className="input"
          />
          {invalid ? (
            <p className="field-error">Not a valid YouTube or Google Drive link.</p>
          ) : (
            <p className="mt-1 text-xs text-ink-soft">We save only the video ID and build the embed safely.</p>
          )}
          <FieldError state={state} name="video_url" />
        </div>
        <div>
          <label className="label" htmlFor="qa-title">
            Title
          </label>
          <input id="qa-title" name="title" maxLength={160} className="input" />
          <FieldError state={state} name="title" />
        </div>
        <div>
          <label className="label" htmlFor="qa-category">
            Category
          </label>
          <select id="qa-category" name="category" defaultValue="promo" className="input capitalize">
            {PORTFOLIO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" /> Publish now (otherwise saved as draft)
        </label>
        <SubmitButton className="btn-primary w-full" pendingText="Saving…">
          Save film
        </SubmitButton>
      </form>
    </section>
  );
}
