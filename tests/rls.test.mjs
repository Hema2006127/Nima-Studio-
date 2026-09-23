// Runs the real migration against PGlite with a minimal Supabase auth/storage stub,
// then exercises RLS as anon / customer / other customer / unverified / admin.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../supabase', import.meta.url));
const migrations = readdirSync(`${root}/migrations`).filter((f) => f.endsWith('.sql')).sort();
const seed = readFileSync(`${root}/seed.sql`, 'utf8');

const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema extensions; create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`);

// Apply the first migration, seed a pre-change portfolio row, then apply the rest
// so data migrations (e.g. category changes) are exercised on real rows.
for (const [i, file] of migrations.entries()) {
  try {
    await db.exec(readFileSync(`${root}/migrations/${file}`, 'utf8'));
  } catch (e) {
    console.error(`MIGRATION ERROR in ${file}:`, e.message, e.position);
    process.exit(1);
  }
  if (i === 0) {
    await db.exec(`insert into public.portfolio_items (title, youtube_video_id, category) values
      ('legacy-wedding', 'LEGACYwed01', 'wedding'), ('legacy-reel', 'LEGACYreel1', 'reel')`);
  }
}
await db.exec(seed);
console.log(`✓ ${migrations.length} migrations + seed applied`);
{
  const cats = Object.fromEntries((await db.query(`select title, category::text c from public.portfolio_items where title like 'legacy-%'`)).rows.map((r) => [r.title, r.c]));
  if (cats['legacy-wedding'] !== 'promo' || cats['legacy-reel'] !== 'reel') { console.error('✗ category migration', cats); process.exit(1); }
  console.log('✓ legacy categories migrated (wedding→promo, reel→reel)');
  await db.exec(`delete from public.portfolio_items where title like 'legacy-%'`);
}

const ADMIN = '00000000-0000-0000-0000-00000000000a';
const CUST = '00000000-0000-0000-0000-00000000000c';
const OTHER = '00000000-0000-0000-0000-00000000000d';
const UNVER = '00000000-0000-0000-0000-00000000000e';
await db.exec(`
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
    ('${ADMIN}', 'admin@x.com', now(), '{"is_admin": true}'),
    ('${CUST}', 'c@x.com', now(), '{"full_name": "Cust One", "phone": "0100"}'),
    ('${OTHER}', 'o@x.com', now(), '{}'),
    ('${UNVER}', 'u@x.com', null, '{}');
  insert into public.admins (user_id) values ('${ADMIN}');
`);

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

async function as(role, uid, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    return fn(tx);
  });
}
async function fails(role, uid, sql, params = []) {
  try { await as(role, uid, (tx) => tx.query(sql, params)); return false; } catch { return true; }
}
async function rows(role, uid, sql, params = []) {
  return (await as(role, uid, (tx) => tx.query(sql, params))).rows;
}

// Profiles trigger
ok((await rows('authenticated', CUST, `select full_name from profiles`))[0]?.full_name === 'Cust One', 'profile auto-created from signup metadata');

// Portfolio visibility
await db.exec(`insert into portfolio_items (title, youtube_video_id, is_published) values ('Pub', 'dQw4w9WgXcQ', true), ('Draft', 'aaaaaaaaaaa', false)`);
ok((await rows('anon', null, `select title from portfolio_items`)).length === 1, 'anon sees only published portfolio items');
ok((await rows('authenticated', CUST, `select title from portfolio_items`)).length === 1, 'customer sees only published portfolio items');
ok((await rows('authenticated', ADMIN, `select title from portfolio_items`)).length === 2, 'admin sees unpublished items (preview)');
ok(await fails('authenticated', ADMIN, `insert into portfolio_items (title, youtube_video_id) values ('bad', '<iframe>')`), 'invalid youtube id rejected by constraint');
ok((await rows('authenticated', ADMIN, `select published_at from portfolio_items where title='Pub'`))[0].published_at !== null, 'published_at set on publish');

const custInsert = await rows('authenticated', CUST, `insert into portfolio_items (title, youtube_video_id) values ('x','bbbbbbbbbbb') returning id`).catch(() => null);
ok(custInsert === null, 'customer cannot insert portfolio items');
await rows('authenticated', CUST, `update portfolio_items set title='hacked'`);
await rows('anon', null, `delete from portfolio_items`).catch(() => {});
ok((await rows('authenticated', ADMIN, `select count(*)::int n from portfolio_items where title='hacked'`))[0].n === 0, 'customer update of portfolio has no effect');
ok((await rows('authenticated', ADMIN, `select count(*)::int n from portfolio_items`))[0].n === 2, 'anon delete of portfolio has no effect');
ok((await rows('authenticated', ADMIN, `insert into portfolio_items (title, youtube_video_id) values ('A','ccccccccccc') returning id`)).length === 1, 'admin can insert portfolio items');

// Admin escalation attempts
ok(await fails('authenticated', CUST, `insert into admins (user_id) values ('${CUST}')`), 'customer cannot add themselves to admins');
ok((await rows('authenticated', CUST, `select public.is_admin() a`))[0].a === false, 'user_metadata does not make a user admin (is_admin=false for customer)');
ok((await rows('authenticated', ADMIN, `select public.is_admin() a`))[0].a === true, 'admins-table user is admin');
ok((await rows('authenticated', CUST, `select * from admins`)).length === 0, 'customer cannot list admins');

// Profiles column protection
await rows('authenticated', CUST, `update profiles set full_name='New' where id='${CUST}'`);
ok((await rows('authenticated', CUST, `select full_name from profiles`))[0].full_name === 'New', 'customer can update own name');
ok(await fails('authenticated', CUST, `update profiles set id='${OTHER}' where id='${CUST}'`), 'customer cannot update profile id');
await rows('authenticated', CUST, `update profiles set full_name='Pwned' where id='${OTHER}'`);
ok((await rows('authenticated', ADMIN, `select full_name from profiles where id='${OTHER}'`))[0].full_name !== 'Pwned', 'customer cannot edit other profiles');
ok((await rows('authenticated', CUST, `select * from profiles`)).length === 1, 'customer sees only own profile');

// Bookings
const svc = (await rows('anon', null, `select id from services order by sort_order`)).map((r) => r.id);
const submit = `select public.submit_booking('wedding', current_date + 30, 'Venue', 200, 'Name', '01000000000', 'notes', $1::uuid[]) id`;
ok(await fails('anon', null, submit, [svc]), 'anon cannot submit booking');
ok(await fails('authenticated', UNVER, submit, [svc]), 'unverified email cannot submit booking');
ok(await fails('authenticated', CUST, `select public.submit_booking('wedding', current_date - 1, 'V', 1, 'N', '01000', '', '{}')`), 'past event date rejected');
ok(await fails('authenticated', CUST, submit, [['11111111-1111-1111-1111-111111111111']]), 'unknown service rejected');
const bookingId = (await rows('authenticated', CUST, submit, [svc.slice(0, 2)]))[0].id;
ok(!!bookingId, 'verified customer can submit booking via RPC');
ok(await fails('authenticated', CUST, `insert into bookings (customer_id, event_type, event_date, venue, contact_name, contact_phone, status) values ('${CUST}','wedding',current_date+5,'v','n','01000','confirmed')`), 'customer cannot insert bookings directly');
await rows('authenticated', CUST, `update bookings set status='confirmed' where id='${bookingId}'`);
ok((await rows('authenticated', CUST, `select status from bookings where id='${bookingId}'`))[0].status === 'pending', 'customer cannot change booking status');
ok((await rows('authenticated', CUST, `select count(*)::int n from booking_services where booking_id='${bookingId}'`))[0].n === 2, 'booking services linked');
ok((await rows('authenticated', OTHER, `select * from bookings`)).length === 0, 'other customer cannot see booking');
ok((await rows('authenticated', OTHER, `select * from booking_services`)).length === 0, 'other customer cannot see booking services');
ok((await rows('authenticated', ADMIN, `select * from bookings`)).length === 1, 'admin sees all bookings');

// Quotations
const qid = (await rows('authenticated', ADMIN, `insert into quotations (booking_id) values ('${bookingId}') returning id`))[0].id;
await rows('authenticated', ADMIN, `insert into quotation_items (quotation_id, description, amount) values ('${qid}', 'Film', 1000)`);
ok((await rows('authenticated', CUST, `select * from quotations`)).length === 0, 'customer cannot see draft quotation');
ok((await rows('authenticated', CUST, `select * from quotation_items`)).length === 0, 'customer cannot see draft quotation items');
await rows('authenticated', ADMIN, `update quotations set status='sent', sent_at=now() where id='${qid}'`);
ok((await rows('authenticated', CUST, `select * from quotations`)).length === 1, 'customer sees sent quotation');
ok((await rows('authenticated', CUST, `select * from quotation_items`)).length === 1, 'customer sees sent quotation items');
ok((await rows('authenticated', OTHER, `select * from quotations`)).length === 0, 'other customer cannot see quotation');
await rows('authenticated', CUST, `update quotation_items set amount=1`);
ok((await rows('authenticated', ADMIN, `select amount::int a from quotation_items`))[0].a === 1000, 'customer cannot modify quotation amounts');
ok(await fails('authenticated', CUST, `insert into quotations (booking_id, status) values ('${bookingId}', 'accepted')`), 'customer cannot insert quotations');

// Payments
ok(await fails('authenticated', CUST, `insert into payments (booking_id, amount) values ('${bookingId}', 500)`), 'customer cannot record payments');
await rows('authenticated', ADMIN, `insert into payments (booking_id, amount) values ('${bookingId}', 500)`);
ok((await rows('authenticated', CUST, `select * from payments`)).length === 1, 'customer sees own payment');
ok((await rows('authenticated', OTHER, `select * from payments`)).length === 0, 'other customer cannot see payment');
ok(await fails('anon', null, `select * from payments`), 'anon has no access to payments');

// Cancel
ok(await fails('authenticated', OTHER, `select public.cancel_booking('${bookingId}')`), 'other customer cannot cancel booking');
await rows('authenticated', CUST, `select public.cancel_booking('${bookingId}')`);
ok((await rows('authenticated', CUST, `select status from bookings`))[0].status === 'cancelled', 'customer can cancel own pending/quoted booking');
ok(await fails('authenticated', CUST, `select public.cancel_booking('${bookingId}')`), 'cannot cancel twice');

// Site settings & services
await rows('authenticated', CUST, `update site_settings set studio_name_en='Hacked'`);
ok((await rows('anon', null, `select studio_name_en from site_settings`))[0].studio_name_en !== 'Hacked', 'customer cannot edit site settings');
await rows('authenticated', ADMIN, `update site_settings set studio_name_en='Real'`);
ok((await rows('anon', null, `select studio_name_en from site_settings`))[0].studio_name_en === 'Real', 'admin can edit site settings');
await rows('authenticated', ADMIN, `update services set is_published=false where slug='photography'`);
ok((await rows('anon', null, `select * from services`)).length === 2, 'anon sees only published services');

// Storage
ok(await fails('authenticated', CUST, `insert into storage.objects (bucket_id, name) values ('portfolio', 'covers/x.jpg')`), 'customer cannot upload to portfolio bucket');
ok((await rows('authenticated', ADMIN, `insert into storage.objects (bucket_id, name) values ('portfolio', 'covers/x.jpg') returning id`)).length === 1, 'admin can upload to portfolio bucket');
ok((await rows('anon', null, `select * from storage.objects`)).length === 0, 'anon cannot list bucket objects');

// save_quotation RPC + profile email
const b2 = (await rows('authenticated', OTHER, `select public.submit_booking('engagement', current_date + 60, 'Hall', 50, 'Other', '01111111111', '', '{}') id`))[0].id;
const items = JSON.stringify([{ description: 'Film', amount: 1500 }, { description: 'Photos', amount: 800 }]);
ok(await fails('authenticated', OTHER, `select public.save_quotation($1, null, null, '', 'EGP', $2::jsonb, true)`, [b2, items]), 'customer cannot call save_quotation');
ok(await fails('authenticated', ADMIN, `select public.save_quotation($1, null, null, '', 'EGP', '[]'::jsonb, false)`, [b2]), 'save_quotation rejects empty items');
const q2 = (await rows('authenticated', ADMIN, `select public.save_quotation($1, null, current_date + 14, 'n', 'EGP', $2::jsonb, false) id`, [b2, items]))[0].id;
ok((await rows('authenticated', OTHER, `select * from quotations where id = $1`, [q2])).length === 0, 'draft saved via RPC is hidden from customer');
await rows('authenticated', ADMIN, `select public.save_quotation($1, $2, current_date + 14, 'n', 'EGP', $3::jsonb, true)`, [b2, q2, JSON.stringify([{ description: 'Film only', amount: 2000 }])]);
ok((await rows('authenticated', OTHER, `select status from bookings where id = $1`, [b2]))[0].status === 'quoted', 'sending quotation moves booking to quoted');
const qi = await rows('authenticated', OTHER, `select description, amount::int a from quotation_items where quotation_id = $1`, [q2]);
ok(qi.length === 1 && qi[0].a === 2000, 'customer sees replaced items after send');
ok((await rows('authenticated', ADMIN, `select email from profiles where id = '${CUST}'`))[0].email === 'c@x.com', 'profile email copied on signup');
await db.exec(`update auth.users set email = 'new@x.com' where id = '${CUST}'`);
ok((await rows('authenticated', ADMIN, `select email from profiles where id = '${CUST}'`))[0].email === 'new@x.com', 'profile email synced on change');
await rows('authenticated', CUST, `update profiles set email = 'spoof@x.com' where id = '${CUST}'`).catch(() => {});
ok((await rows('authenticated', ADMIN, `select email from profiles where id = '${CUST}'`))[0].email === 'new@x.com', 'customer cannot change profile email');

// Internal functions
ok(await fails('authenticated', CUST, `select public.handle_new_user()`), 'internal trigger function not callable');

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll RLS checks passed');
process.exit(failures ? 1 : 0);
