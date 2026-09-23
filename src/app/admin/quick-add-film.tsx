'use client';

import { useActionState, useState } from 'react';
import { createPortfolioItem } from './portfolio/actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import { parseYouTubeId } from '@/lib/youtube';
import { PORTFOLIO_CATEGORIES, type ActionState } from '@/lib/types';

export function QuickAddFilm() {
  const [url, setUrl] = useState('');
  const [state, action] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await createPortfolioItem(prev, fd);
    if (result?.ok) setUrl('');
    return result;
  }, null);
  const invalid = url.length > 0 && !parseYouTubeId(url);

  return (
    <section className="card self-start p-6">
      <h2 className="text-lg font-medium">Quick add: YouTube film</h2>
      <form action={action} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="stay" value="1" />
        <input type="hidden" name="sort_order" value="0" />
        <FormMessage state={state} />
        <div>
          <label className="label" htmlFor="qa-url">
            YouTube link
          </label>
          <input
            id="qa-url"
            name="youtube_url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="input"
          />
          {invalid ? (
            <p className="field-error">Not a valid YouTube video link.</p>
          ) : (
            <p className="mt-1 text-xs text-ink-soft">We save only the video ID and build the embed safely.</p>
          )}
          <FieldError state={state} name="youtube_url" />
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
          <select id="qa-category" name="category" defaultValue="wedding" className="input capitalize">
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
