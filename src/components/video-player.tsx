'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { PlayIcon } from './icons';
import { isValidVideo, videoEmbedUrl, videoThumbnailUrl, type VideoProvider } from '@/lib/video';

interface Props {
  provider?: VideoProvider;
  videoId: string;
  title: string;
  coverUrl?: string | null;
  label?: string;
  playLabel?: string;
  className?: string;
  size?: 'sm' | 'lg';
  badge?: React.ReactNode;
  aspect?: string;
}

/**
 * Click-to-play video (YouTube or Google Drive). Shows the cover or the provider's
 * thumbnail first and only loads the iframe (youtube-nocookie / Drive preview) after a click.
 */
export function VideoPlayer({ provider = 'youtube', videoId, title, coverUrl, label, playLabel = 'Play video', className = '', size = 'sm', badge, aspect = 'aspect-video' }: Props) {
  const [playing, setPlaying] = useState(false);
  const valid = isValidVideo(provider, videoId);
  const video = { provider, id: videoId };
  // Thumbnail fallbacks: HD → standard → none (e.g. a Drive file that isn't public).
  const [thumbFailures, setThumbFailures] = useState(0);
  const poster =
    coverUrl ??
    (valid && thumbFailures < 2 ? videoThumbnailUrl(video, { large: size === 'lg' && thumbFailures === 0 }) : null);

  // Drive doesn't serve thumbnails to other sites and can't autoplay, so without a
  // custom cover we show Drive's own player (poster + play button) right away.
  const driveInline = provider === 'drive' && !coverUrl;

  if (valid && (playing || driveInline)) {
    const iframeProps = {
      src: videoEmbedUrl(video, { autoplay: true }),
      title,
      loading: driveInline ? ('lazy' as const) : undefined,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      referrerPolicy: 'strict-origin-when-cross-origin' as const,
      allowFullScreen: true,
    };
    return (
      <div className={`relative w-full overflow-hidden bg-black ${aspect} ${className}`}>
        {provider === 'drive' ? (
          <ScaledFrame {...iframeProps} />
        ) : (
          <iframe {...iframeProps} className="absolute inset-0 h-full w-full" />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => valid && setPlaying(true)}
      disabled={!valid}
      aria-label={`${playLabel}: ${title}`}
      className={`group relative block w-full overflow-hidden bg-media text-start ${aspect} ${className}`}
    >
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- remote thumbnails; sizes vary per source
        <img
          src={poster}
          alt=""
          loading="lazy"
          onError={() => setThumbFailures((n) => n + 1)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}
      <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
      {badge && <span className="absolute start-3 top-3">{badge}</span>}
      <span
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition-transform group-hover:scale-105 ${
          size === 'lg' ? 'h-16 w-16' : 'h-11 w-11'
        }`}
      >
        <PlayIcon size={size === 'lg' ? 18 : 14} />
      </span>
      {label && <span className="absolute bottom-3 end-3 bg-black/55 px-1.5 py-0.5 text-[11px] text-white">{label}</span>}
    </button>
  );
}

/** Drive's player needs ~420px of width; narrower frames clip its controls. */
const DRIVE_MIN_WIDTH = 420;

/**
 * Renders the iframe at least DRIVE_MIN_WIDTH wide and scales it down to fit the
 * frame, so Drive's controls keep their layout on narrow phone screens.
 */
function ScaledFrame(props: React.IframeHTMLAttributes<HTMLIFrameElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = box && box.w < DRIVE_MIN_WIDTH ? box.w / DRIVE_MIN_WIDTH : 1;
  return (
    <div ref={ref} className="absolute inset-0" dir="ltr">
      {box && (
        <iframe
          {...props}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: box.w / scale, height: box.h / scale, transform: scale === 1 ? undefined : `scale(${scale})` }}
        />
      )}
    </div>
  );
}
