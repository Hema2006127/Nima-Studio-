'use client';

import { useState } from 'react';
import { PlayIcon } from './icons';
import { isValidYouTubeId, youTubeEmbedUrl, youTubeThumbnailUrl } from '@/lib/youtube';

interface Props {
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
 * Click-to-play YouTube embed. Shows the cover (or YouTube thumbnail) first and
 * only loads the privacy-enhanced youtube-nocookie iframe after a click.
 */
export function VideoPlayer({ videoId, title, coverUrl, label, playLabel = 'Play video', className = '', size = 'sm', badge, aspect = 'aspect-video' }: Props) {
  const [playing, setPlaying] = useState(false);
  const valid = isValidYouTubeId(videoId);
  // Large players use the HD thumbnail (no letterbox bars); fall back if a video has none.
  const [hdFailed, setHdFailed] = useState(false);
  const poster = coverUrl ?? (valid ? youTubeThumbnailUrl(videoId, size === 'lg' && !hdFailed ? 'maxresdefault' : 'hqdefault') : null);

  if (playing && valid) {
    return (
      <div className={`relative w-full overflow-hidden bg-black ${aspect} ${className}`}>
        <iframe
          src={youTubeEmbedUrl(videoId, { autoplay: true })}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
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
          onError={() => setHdFailed(true)}
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
