'use client';

import { useRef, useState } from 'react';
import { youTubeEmbedUrl, youTubeThumbnailUrl } from '@/lib/youtube';

/**
 * Hero showreel that starts playing on page load: muted, looping, no player chrome
 * (like an Instagram reel). A transparent layer swallows taps so YouTube's UI never
 * appears; the button toggles sound through the YouTube iframe API (postMessage).
 */
export function AutoplayReel({
  videoId,
  title,
  aspect,
  className = '',
  soundOnLabel,
  soundOffLabel,
}: {
  videoId: string;
  title: string;
  aspect: string;
  className?: string;
  soundOnLabel: string;
  soundOffLabel: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  const command = (func: string, args: unknown[] = []) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube-nocookie.com');

  const toggleSound = () => {
    if (muted) {
      command('unMute');
      command('setVolume', [100]);
      command('playVideo');
    } else {
      command('mute');
    }
    setMuted(!muted);
  };

  return (
    <div className={`relative w-full overflow-hidden bg-black ${aspect} ${className}`}>
      {/* Thumbnail behind the player while it loads */}
      {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail */}
      <img src={youTubeThumbnailUrl(videoId, 'hqdefault')} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <iframe
        ref={frame}
        src={youTubeEmbedUrl(videoId, { background: true })}
        title={title}
        // Slightly oversized so YouTube's edge UI stays outside the visible frame.
        className="pointer-events-none absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="absolute inset-0" aria-hidden />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? soundOnLabel : soundOffLabel}
        aria-pressed={!muted}
        className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
      >
        {muted ? <SpeakerOff /> : <SpeakerOn />}
      </button>
    </div>
  );
}

function SpeakerOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  );
}
