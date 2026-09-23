# Wedding Studio Website

Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage). Bilingual (English / Arabic RTL) with light and dark mode.

## Setup

1. **Create a Supabase project**, then apply the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push          # runs supabase/migrations/*
   ```
   Or paste `supabase/migrations/20260923000000_initial_schema.sql` into the SQL editor. `supabase/seed.sql` adds three starter services (optional).

2. **Environment**: copy `.env.example` to `.env.local` and fill in the project URL and anon key.

3. **Auth settings** (Supabase dashboard → Authentication):
   - Keep **Confirm email** enabled.
   - URL Configuration → Site URL: your domain. Redirect URLs: add `https://your-domain/auth/callback` and `http://localhost:3000/auth/callback`.

4. **Create your admin account** (there is no public admin signup):
   - Authentication → Users → *Add user* (with your email and password, auto-confirmed).
   - SQL editor:
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = 'you@example.com';
     ```

5. Run it:
   ```bash
   npm install
   npm run dev
   ```

## Deploying

See [DEPLOYMENT.md](DEPLOYMENT.md) (Vercel + custom domain + Supabase auth/SMTP settings).

## Adding a film

Upload the video to YouTube, then go to **/admin/portfolio → Add YouTube film**, paste the link, and tick *Published*. Only the 11-character video ID is stored; the site embeds it with `youtube-nocookie.com`.

## Security model

- **Admin** = a row in `public.admins`, checked by `public.is_admin()`. `user_metadata` is never used for permissions.
- Admin pages call `requireAdmin()`, admin server actions call `assertAdmin()`, and RLS enforces the same rule in the database.
- Customers create bookings only through the `submit_booking()` RPC. It requires a verified email and ignores protected fields such as status. They can cancel only through `cancel_booking()`, and they can read only their own bookings, sent quotations and payments.
- The service-role key is not used anywhere.
- Storage bucket `portfolio`: public read via URL, admin-only writes, images only (JPG/PNG/WebP/AVIF), 5 MB max. The server also checks each file's magic bytes.

## Tests

```bash
npm test          # YouTube URL parser + migration/RLS suite (runs the real migration in PGlite)
npm run typecheck
npm run lint
```
