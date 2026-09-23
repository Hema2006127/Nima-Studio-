import 'server-only';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const;

type ImageType = keyof typeof TYPES;

function sniff(bytes: Uint8Array): ImageType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  return null;
}

/**
 * Validates an uploaded image by declared type, size and magic bytes.
 * Video files (or anything else) are rejected.
 */
export async function validateImage(
  file: File,
): Promise<{ ok: true; contentType: ImageType; ext: string; body: ArrayBuffer } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: 'The file is empty.' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'Images must be 4 MB or smaller.' };
  if (!(file.type in TYPES)) return { ok: false, error: 'Only JPG, PNG, WebP or AVIF images are allowed.' };

  const body = await file.arrayBuffer();
  const detected = sniff(new Uint8Array(body.slice(0, 16)));
  if (!detected || detected !== file.type) return { ok: false, error: 'The file does not look like a valid image.' };

  return { ok: true, contentType: detected, ext: TYPES[detected], body };
}
