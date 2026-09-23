'use client';

import { useActionState, useState } from 'react';
import { createPortfolioItem, updatePortfolioItem } from './actions';
import { FieldError, FormMessage, SubmitButton } from '@/components/form';
import { VideoPlayer } from '@/components/video-player';
import { parseYouTubeId, youTubeWatchUrl } from '@/lib/youtube';
import { PORTFOLIO_CATEGORIES, type PortfolioItem } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  promo: 'Promo',
  reel: 'Reel',
};

export function PortfolioForm({ item, coverUrl }: { item?: PortfolioItem; coverUrl?: string | null }) {
  const [state, action] = useActionState(item ? updatePortfolioItem : createPortfolioItem, null);
  const [url, setUrl] = useState(item ? youTubeWatchUrl(item.youtube_video_id) : '');
  const [preview, setPreview] = useState<string | null>(null);
  const videoId = parseYouTubeId(url);

  return (
    <form action={action} className="grid gap-8 xl:grid-cols-[1fr_380px]" noValidate>
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="card space-y-5 p-6 sm:p-8">
        <FormMessage state={state} />

        <div>
          <label htmlFor="youtube_url" className="label">
            YouTube link
          </label>
          <input
            id="youtube_url"
            name="youtube_url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or https://youtu.be/…"
            className="input"
            required
          />
          {url && !videoId ? (
            <p className="field-error">Not a valid YouTube video link.</p>
          ) : (
            <p className="mt-1 text-xs text-ink-soft">We store only the video ID and build a privacy-friendly embed from it.</p>
          )}
          <FieldError state={state} name="youtube_url" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="label">
              Title (couple names)
            </label>
            <input id="title" name="title" defaultValue={item?.title} required maxLength={160} className="input" />
            <FieldError state={state} name="title" />
          </div>
          <div>
            <label htmlFor="title_ar" className="label">
              Title — Arabic <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input id="title_ar" name="title_ar" defaultValue={item?.title_ar} maxLength={160} dir="rtl" className="input" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="description" className="label">
              Description <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea id="description" name="description" defaultValue={item?.description} rows={3} maxLength={4000} className="input" />
          </div>
          <div>
            <label htmlFor="description_ar" className="label">
              Description — Arabic <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea id="description_ar" name="description_ar" defaultValue={item?.description_ar} rows={3} maxLength={4000} dir="rtl" className="input" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="category" className="label">
              Category
            </label>
            <select id="category" name="category" defaultValue={item?.category ?? 'promo'} className="input">
              {PORTFOLIO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <FieldError state={state} name="category" />
          </div>
          <div>
            <label htmlFor="venue" className="label">
              Venue
            </label>
            <input id="venue" name="venue" defaultValue={item?.venue} maxLength={200} className="input" />
          </div>
          <div>
            <label htmlFor="event_date" className="label">
              Event date
            </label>
            <input id="event_date" name="event_date" type="date" defaultValue={item?.event_date ?? ''} className="input" />
            <FieldError state={state} name="event_date" />
          </div>
        </div>

        <div>
          <label htmlFor="cover" className="label">
            Cover image <span className="font-normal text-ink-soft">(optional — defaults to the YouTube thumbnail)</span>
          </label>
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="input file:me-3 file:border-0 file:bg-soft file:px-3 file:py-1 file:text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          <p className="mt-1 text-xs text-ink-soft">JPG, PNG, WebP or AVIF · max 4 MB. Videos are never uploaded here — they live on YouTube.</p>
          <FieldError state={state} name="cover" />
          {item?.cover_image_path && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_cover" /> Remove current cover
            </label>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3 sm:items-end">
          <div>
            <label htmlFor="sort_order" className="label">
              Display order
            </label>
            <input id="sort_order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} className="input" />
            <p className="mt-1 text-xs text-ink-soft">Lower numbers appear first.</p>
          </div>
          <label className="flex items-center gap-2 pb-7 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={item?.is_published ?? false} /> Published
          </label>
          <label className="flex items-center gap-2 pb-7 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={item?.is_featured ?? false} /> Featured on home page
          </label>
        </div>

        <SubmitButton pendingText="Saving…">{item ? 'Save changes' : 'Save film'}</SubmitButton>
      </div>

      <aside className="space-y-3">
        <p className="text-sm font-medium">Preview</p>
        {videoId ? (
          <VideoPlayer key={`${videoId}-${preview ?? coverUrl ?? ''}`} videoId={videoId} title="Preview" coverUrl={preview ?? coverUrl} />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-media text-xs text-ink-soft">Paste a YouTube link to preview</div>
        )}
        <p className="text-xs text-ink-soft">
          Unpublished items are visible only to admins. Publish when you’re happy with the preview.
        </p>
      </aside>
    </form>
  );
}
