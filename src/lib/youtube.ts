// YouTube helpers. Only the 11-character video ID is ever stored; embed and
// thumbnail URLs are always rebuilt from a validated ID.

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeId(id: unknown): id is string {
  return typeof id === 'string' && VIDEO_ID_RE.test(id);
}

/**
 * Extracts the video ID from a YouTube URL (watch, youtu.be, shorts, embed,
 * live, nocookie, mobile) or accepts a bare ID. Returns null when invalid.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (isValidYouTubeId(value)) return value;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  let candidate: string | null = null;

  if (host === 'youtu.be') {
    candidate = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      candidate = url.searchParams.get('v');
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v|e)\/([^/]+)/);
      candidate = match?.[1] ?? null;
    }
  }

  return isValidYouTubeId(candidate) ? candidate : null;
}

export function youTubeEmbedUrl(id: string, { autoplay = false, background = false } = {}): string {
  if (!isValidYouTubeId(id)) throw new Error('Invalid YouTube video ID');
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  if (autoplay) params.set('autoplay', '1');
  if (background) {
    // Muted, looping, chrome-less reel. Browsers only allow autoplay when muted;
    // enablejsapi lets the page unmute it via postMessage.
    params.set('autoplay', '1');
    params.set('mute', '1');
    params.set('loop', '1');
    params.set('playlist', id);
    params.set('controls', '0');
    params.set('disablekb', '1');
    params.set('iv_load_policy', '3');
    params.set('fs', '0');
    params.set('enablejsapi', '1');
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youTubeThumbnailUrl(id: string, quality: 'hqdefault' | 'maxresdefault' = 'hqdefault'): string {
  if (!isValidYouTubeId(id)) throw new Error('Invalid YouTube video ID');
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function youTubeWatchUrl(id: string): string {
  if (!isValidYouTubeId(id)) throw new Error('Invalid YouTube video ID');
  return `https://www.youtube.com/watch?v=${id}`;
}
