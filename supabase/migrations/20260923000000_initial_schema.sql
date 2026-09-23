-- =============================================================================
-- Wedding studio — initial schema
-- Tables, constraints, indexes, RLS policies, RPCs and the storage bucket.
--
-- Security model
--   * Admins are rows in public.admins (created manually from the dashboard).
--     public.is_admin() is the single source of truth; user_metadata is never used.
--   * Customers never write bookings/quotations/payments directly. Bookings are
--     created through public.submit_booking() (checks email verification) and
--     cancelled through public.cancel_booking(). Everything else is admin-only.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.portfolio_category as enum ('wedding', 'engagement', 'session', 'reel', 'other');
create type public.booking_status     as enum ('pending', 'quoted', 'confirmed', 'completed', 'cancelled');
create type public.event_type         as enum ('wedding', 'engagement', 'session', 'reel', 'other');
create type public.quotation_status   as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
create type public.payment_method     as enum ('cash', 'bank_transfer', 'instapay', 'vodafone_cash', 'card', 'other');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Admins
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.admins is 'Users with admin access. Insert rows manually from the Supabase dashboard / SQL editor.';

-- SECURITY DEFINER so policies can call it without granting read access to admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Profiles (one per auth user)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text check (char_length(full_name) <= 120),
  phone      text check (char_length(phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically on signup. Only display fields are copied from
-- the signup metadata; nothing here grants permissions.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    left(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 120),
    left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 30)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile email (shown to admins) in sync with auth.users.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Site settings (single row)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id                   smallint primary key default 1 check (id = 1),
  studio_name_en       text not null default 'Studio Name',
  studio_name_ar       text not null default 'اسم الاستوديو',
  tagline_en           text not null default 'Wedding films & photography',
  tagline_ar           text not null default 'تصوير أفلام وصور الأفراح',
  hero_title_en        text not null default 'Every vow, every glance — kept for a lifetime.',
  hero_title_ar        text not null default 'كل لحظة في يومكم… محفوظة للعمر.',
  hero_subtitle_en     text not null default 'We film and photograph weddings with a quiet, cinematic eye, so you can live your day and relive it for years.',
  hero_subtitle_ar     text not null default 'بنصوّر فرحكم بعين سينمائية هادية، عشان تعيشوا يومكم براحتكم وترجعوا تعيشوه تاني سنين قدام.',
  about_en             text not null default '',
  about_ar             text not null default '',
  showreel_youtube_id  text check (showreel_youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  whatsapp_number      text check (whatsapp_number ~ '^[0-9]{8,15}$'),
  instagram_url        text check (instagram_url ~ '^https://(www\.)?instagram\.com/'),
  phone                text,
  email                text,
  city_en              text not null default 'Cairo, Egypt',
  city_ar              text not null default 'القاهرة، مصر',
  updated_at           timestamptz not null default now()
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1);

-- -----------------------------------------------------------------------------
-- Services
-- -----------------------------------------------------------------------------
create table public.services (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en       text not null check (char_length(title_en) between 1 and 120),
  title_ar       text not null default '',
  description_en text not null default '',
  description_ar text not null default '',
  price_from     numeric(12, 2) check (price_from >= 0),
  currency       text not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  sort_order     integer not null default 0,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index services_published_order_idx on public.services (is_published, sort_order);

create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Portfolio (YouTube-hosted videos; only the validated video ID is stored)
-- -----------------------------------------------------------------------------
create table public.portfolio_items (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 160),
  title_ar         text not null default '',
  description      text not null default '',
  description_ar   text not null default '',
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  cover_image_path text check (cover_image_path ~ '^covers/[A-Za-z0-9._-]+$'),
  category         public.portfolio_category not null default 'wedding',
  venue            text not null default '',
  event_date       date,
  is_published     boolean not null default false,
  is_featured      boolean not null default false,
  sort_order       integer not null default 0,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index portfolio_public_idx   on public.portfolio_items (is_published, category, sort_order);
create index portfolio_featured_idx on public.portfolio_items (is_published, is_featured, sort_order);

create trigger portfolio_items_updated_at before update on public.portfolio_items
  for each row execute function public.set_updated_at();

create or replace function public.portfolio_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    new.published_at = coalesce(new.published_at, now());
  elsif not new.is_published then
    new.published_at = null;
  end if;
  return new;
end;
$$;

create trigger portfolio_items_published_at before insert or update on public.portfolio_items
  for each row execute function public.portfolio_set_published_at();

-- -----------------------------------------------------------------------------
-- Bookings
-- -----------------------------------------------------------------------------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  reference     bigint generated always as identity unique,
  customer_id   uuid not null references public.profiles (id) on delete cascade,
  event_type    public.event_type not null,
  event_date    date not null,
  venue         text not null check (char_length(venue) between 1 and 200),
  guest_count   integer check (guest_count between 1 and 10000),
  contact_name  text not null check (char_length(contact_name) between 1 and 120),
  contact_phone text not null check (char_length(contact_phone) between 5 and 30),
  notes         text not null default '' check (char_length(notes) <= 2000),
  status        public.booking_status not null default 'pending',
  admin_notes   text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index bookings_status_idx   on public.bookings (status, created_at desc);
create index bookings_date_idx     on public.bookings (event_date);

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- Coverage requested for a booking (many-to-many with services)
create table public.booking_services (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  primary key (booking_id, service_id)
);

create index booking_services_service_idx on public.booking_services (service_id);

-- -----------------------------------------------------------------------------
-- Quotations
-- -----------------------------------------------------------------------------
create table public.quotations (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  status      public.quotation_status not null default 'draft',
  currency    text not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  valid_until date,
  notes       text not null default '',
  sent_at     timestamptz,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index quotations_booking_idx on public.quotations (booking_id, created_at desc);
create index quotations_status_idx  on public.quotations (status);

create trigger quotations_updated_at before update on public.quotations
  for each row execute function public.set_updated_at();

create table public.quotation_items (
  id           uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  description  text not null check (char_length(description) between 1 and 200),
  amount       numeric(12, 2) not null check (amount >= 0),
  sort_order   integer not null default 0
);

create index quotation_items_quotation_idx on public.quotation_items (quotation_id, sort_order);

-- -----------------------------------------------------------------------------
-- Payments
-- -----------------------------------------------------------------------------
create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  method      public.payment_method not null default 'cash',
  paid_at     date not null default current_date,
  reference   text not null default '',
  notes       text not null default '',
  recorded_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);
create index payments_paid_at_idx on public.payments (paid_at desc);

-- -----------------------------------------------------------------------------
-- Customer RPCs
-- -----------------------------------------------------------------------------

-- Create a booking for the signed-in, email-verified user. Protected fields
-- (status, admin_notes, customer_id) cannot be supplied by the caller.
create or replace function public.submit_booking(
  p_event_type    public.event_type,
  p_event_date    date,
  p_venue         text,
  p_guest_count   integer,
  p_contact_name  text,
  p_contact_phone text,
  p_notes         text,
  p_service_ids   uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := auth.uid();
  v_booking_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from auth.users u where u.id = v_uid and u.email_confirmed_at is not null
  ) then
    raise exception 'Email address is not verified' using errcode = '42501';
  end if;

  if p_event_date < current_date then
    raise exception 'Event date must be in the future' using errcode = '22023';
  end if;

  if (select count(*) from public.bookings b
      where b.customer_id = v_uid and b.created_at > now() - interval '1 day') >= 10 then
    raise exception 'Too many booking requests, please try again later' using errcode = '54000';
  end if;

  if coalesce(array_length(p_service_ids, 1), 0) > 0 and exists (
    select 1 from unnest(p_service_ids) sid
    where not exists (select 1 from public.services s where s.id = sid and s.is_published)
  ) then
    raise exception 'Unknown service' using errcode = '22023';
  end if;

  -- Make sure the profile exists (users created before the trigger, etc.)
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;

  insert into public.bookings (customer_id, event_type, event_date, venue, guest_count,
                               contact_name, contact_phone, notes)
  values (v_uid, p_event_type, p_event_date, trim(p_venue), p_guest_count,
          trim(p_contact_name), trim(p_contact_phone), coalesce(trim(p_notes), ''))
  returning id into v_booking_id;

  insert into public.booking_services (booking_id, service_id)
  select distinct v_booking_id, sid from unnest(coalesce(p_service_ids, '{}')) sid;

  return v_booking_id;
end;
$$;

-- A customer may cancel their own booking while it is still pending or quoted.
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.bookings
     set status = 'cancelled'
   where id = p_booking_id
     and customer_id = auth.uid()
     and status in ('pending', 'quoted');

  if not found then
    raise exception 'Booking cannot be cancelled' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.submit_booking(public.event_type, date, text, integer, text, text, text, uuid[]) from public, anon;
revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.submit_booking(public.event_type, date, text, integer, text, text, text, uuid[]) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- Internal trigger/helper functions must not be callable through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.portfolio_set_published_at() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Admin RPC: save a quotation and its line items atomically.
-- SECURITY INVOKER: RLS on quotations/quotation_items/bookings applies too.
-- p_items: [{"description": "...", "amount": 1000}, ...]
-- -----------------------------------------------------------------------------
create or replace function public.save_quotation(
  p_booking_id   uuid,
  p_quotation_id uuid,
  p_valid_until  date,
  p_notes        text,
  p_currency     text,
  p_items        jsonb,
  p_send         boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_quotation_id;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A quotation needs at least one line item' using errcode = '22023';
  end if;

  if v_id is null then
    insert into public.quotations (booking_id, valid_until, notes, currency, created_by)
    values (p_booking_id, p_valid_until, coalesce(p_notes, ''), coalesce(p_currency, 'EGP'), auth.uid())
    returning id into v_id;
  else
    update public.quotations
       set valid_until = p_valid_until, notes = coalesce(p_notes, ''), currency = coalesce(p_currency, 'EGP')
     where id = v_id and booking_id = p_booking_id;
    if not found then
      raise exception 'Quotation not found' using errcode = 'P0002';
    end if;
    delete from public.quotation_items where quotation_id = v_id;
  end if;

  insert into public.quotation_items (quotation_id, description, amount, sort_order)
  select v_id, trim(item ->> 'description'), (item ->> 'amount')::numeric, ord::int
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);

  if p_send then
    update public.quotations set status = 'sent', sent_at = now() where id = v_id;
    update public.bookings set status = 'quoted' where id = p_booking_id and status = 'pending';
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_quotation(uuid, uuid, date, text, text, jsonb, boolean) from public, anon;
grant execute on function public.save_quotation(uuid, uuid, date, text, text, jsonb, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admins           enable row level security;
alter table public.profiles         enable row level security;
alter table public.site_settings    enable row level security;
alter table public.services         enable row level security;
alter table public.portfolio_items  enable row level security;
alter table public.bookings         enable row level security;
alter table public.booking_services enable row level security;
alter table public.quotations       enable row level security;
alter table public.quotation_items  enable row level security;
alter table public.payments         enable row level security;

-- admins: a user can see whether they are an admin; no API writes at all.
create policy "admins: read own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Customers may only change their display fields.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- site_settings
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: admin update" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- services
create policy "services: public read published" on public.services
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "services: admin insert" on public.services
  for insert to authenticated with check ((select public.is_admin()));
create policy "services: admin update" on public.services
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "services: admin delete" on public.services
  for delete to authenticated using ((select public.is_admin()));

-- portfolio_items (admins also see unpublished items so they can preview them)
create policy "portfolio: public read published" on public.portfolio_items
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "portfolio: admin insert" on public.portfolio_items
  for insert to authenticated with check ((select public.is_admin()));
create policy "portfolio: admin update" on public.portfolio_items
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "portfolio: admin delete" on public.portfolio_items
  for delete to authenticated using ((select public.is_admin()));

-- bookings: customers read their own; all writes go through RPCs or admins.
create policy "bookings: read own or admin" on public.bookings
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.is_admin()));
create policy "bookings: admin update" on public.bookings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "bookings: admin delete" on public.bookings
  for delete to authenticated using ((select public.is_admin()));

-- booking_services
create policy "booking_services: read own or admin" on public.booking_services
  for select to authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = (select auth.uid()))
  );
create policy "booking_services: admin write" on public.booking_services
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- quotations: customers see only non-draft quotations for their own bookings.
create policy "quotations: read own sent or admin" on public.quotations
  for select to authenticated using (
    (select public.is_admin())
    or (status <> 'draft' and exists (
      select 1 from public.bookings b where b.id = booking_id and b.customer_id = (select auth.uid())))
  );
create policy "quotations: admin insert" on public.quotations
  for insert to authenticated with check ((select public.is_admin()));
create policy "quotations: admin update" on public.quotations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "quotations: admin delete" on public.quotations
  for delete to authenticated using ((select public.is_admin()));

create policy "quotation_items: read own sent or admin" on public.quotation_items
  for select to authenticated using (
    (select public.is_admin())
    or exists (
      select 1 from public.quotations q join public.bookings b on b.id = q.booking_id
      where q.id = quotation_id and q.status <> 'draft' and b.customer_id = (select auth.uid()))
  );
create policy "quotation_items: admin write" on public.quotation_items
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- payments
create policy "payments: read own or admin" on public.payments
  for select to authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = (select auth.uid()))
  );
create policy "payments: admin insert" on public.payments
  for insert to authenticated with check ((select public.is_admin()));
create policy "payments: admin update" on public.payments
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "payments: admin delete" on public.payments
  for delete to authenticated using ((select public.is_admin()));

-- Anonymous visitors never need to touch private tables.
revoke all on public.admins, public.profiles, public.bookings, public.booking_services,
              public.quotations, public.quotation_items, public.payments from anon;

-- -----------------------------------------------------------------------------
-- Storage: public bucket for portfolio cover images (images only, 5 MB max)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public URLs work without a select policy; only admins may list objects.
create policy "portfolio bucket: admin read" on storage.objects
  for select to authenticated using (bucket_id = 'portfolio' and (select public.is_admin()));
create policy "portfolio bucket: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and (select public.is_admin()));
create policy "portfolio bucket: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and (select public.is_admin()))
  with check (bucket_id = 'portfolio' and (select public.is_admin()));
create policy "portfolio bucket: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and (select public.is_admin()));
