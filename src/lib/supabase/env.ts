// Public Supabase configuration. The service-role key is intentionally not
// referenced anywhere in the app: every query runs as the signed-in user and
// is authorised by RLS.

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL — copy .env.example to .env.local');
  return url;
}

export function supabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.example to .env.local');
  return key;
}

export function storagePublicUrl(path: string | null | undefined, bucket = 'portfolio'): string | null {
  if (!path) return null;
  return `${supabaseUrl()}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
