// Video sources: YouTube or Google Drive. Only { provider, id } is stored;
// every embed/thumbnail URL is rebuilt here from a validated ID.

import { isValidYouTubeId, parseYouTubeId, youTubeEmbedUrl, youTubeThumbnailUrl, youTubeWatchUrl } from './youtube.ts';

export type VideoProvider = 'youtube' | 'drive';
export type VideoRef = { provider: VideoProvider; id: string };

const DRIVE_ID_RE = /^[A-Za-z0-9_-]{20,100}$/;

export function isValidVideo(provider: string, id: unknown): id is string {
  if (provider === 'youtube') return isValidYouTubeId(id);
  if (provider === 'drive') return typeof id === 'string' && DRIVE_ID_RE.test(id);
  return false;
}

/**
 * Extracts the file ID from a Google Drive link:
 * /file/d/<id>/view|preview|edit, /open?id=<id>, /uc?id=<id>, docs.google.com/file/d/<id>.
 */
export function parseDriveId(input: string): string | null {
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  if (host !== 'drive.google.com' && host !== 'docs.google.com') return null;

  const fromPath = url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1];
  const candidate = fromPath ?? url.searchParams.get('id');
  return candidate && DRIVE_ID_RE.test(candidate) ? candidate : null;
}

/** Accepts a YouTube or Google Drive link (or a bare YouTube ID). */
export function parseVideoUrl(input: string): VideoRef | null {
  const youtube = parseYouTubeId(input);
  if (youtube) return { provider: 'youtube', id: youtube };
  const drive = parseDriveId(input);
  if (drive) return { provider: 'drive', id: drive };
  return null;
}

export function videoEmbedUrl({ provider, id }: VideoRef, { autoplay = false } = {}): string {
  if (!isValidVideo(provider, id)) throw new Error('Invalid video ID');
  if (provider === 'youtube') return youTubeEmbedUrl(id, { autoplay });
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function videoThumbnailUrl({ provider, id }: VideoRef, { large = false } = {}): string {
  if (!isValidVideo(provider, id)) throw new Error('Invalid video ID');
  if (provider === 'youtube') return youTubeThumbnailUrl(id, large ? 'maxresdefault' : 'hqdefault');
  // Works for files shared as "Anyone with the link".
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${large ? 1280 : 640}`;
}

export function videoWatchUrl({ provider, id }: VideoRef): string {
  if (!isValidVideo(provider, id)) throw new Error('Invalid video ID');
  return provider === 'youtube' ? youTubeWatchUrl(id) : `https://drive.google.com/file/d/${id}/view`;
}
