-- ============================================================
--  Juniper Club — APPLY ALL PENDING MIGRATIONS  (003 → 004 → 005 → 006)
--  ----------------------------------------------------------
--  HOW TO RUN (fixes the "Could not find the table 'public.client_logos'"
--  error and unlocks the Logos / Favourites / Drift admin tabs):
--
--    1. Open https://supabase.com  →  your project  →  SQL Editor
--    2. Click "New query"
--    3. Paste this ENTIRE file
--    4. Click "Run"
--
--  Every statement is idempotent — safe to run more than once.
--  Migrations 001 (schema) and 002 (seed venues) are already applied.
-- ============================================================


-- ============================================================
-- 003 — avatar uploads
-- ============================================================
alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_user_insert_own" on storage.objects;
create policy "avatars_user_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_update_own" on storage.objects;
create policy "avatars_user_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_delete_own" on storage.objects;
create policy "avatars_user_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- 004 — lock down profile self-edits (security: stops members
--        self-promoting their subscription tier / status)
-- ============================================================
drop policy if exists "users update own basic profile" on public.profiles;

create policy "users update own basic profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and is_admin            = (select is_admin            from public.profiles where user_id = auth.uid())
    and subscription_status = (select subscription_status from public.profiles where user_id = auth.uid())
    and subscription_tier   = (select subscription_tier   from public.profiles where user_id = auth.uid())
    and email               = (select email               from public.profiles where user_id = auth.uid())
  );


-- ============================================================
-- 005 — editable content: client_logos + member_favourites
-- ============================================================
create table if not exists public.client_logos (
  id             uuid primary key default gen_random_uuid(),
  label          text not null,
  variant        text not null default 'serif' check (variant in (
                   'serif', 'display', 'caps', 'minimal', 'smallcaps', 'heavy', 'bracket'
                 )),
  mark           text,
  subline        text,
  display_order  integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists client_logos_order_idx
  on public.client_logos (display_order desc, created_at);

alter table public.client_logos enable row level security;

drop policy if exists "client_logos_public_read"    on public.client_logos;
drop policy if exists "client_logos_admin_insert"   on public.client_logos;
drop policy if exists "client_logos_admin_update"   on public.client_logos;
drop policy if exists "client_logos_admin_delete"   on public.client_logos;

create policy "client_logos_public_read"
  on public.client_logos for select
  using (is_published = true);

create policy "client_logos_admin_insert"
  on public.client_logos for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

create policy "client_logos_admin_update"
  on public.client_logos for update to authenticated
  using       (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true))
  with check  (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

create policy "client_logos_admin_delete"
  on public.client_logos for delete to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

insert into public.client_logos (label, variant, mark, subline, display_order)
select * from (values
  ('The Velvet Botanist', 'serif',     '✦',  null,          100),
  ('Marble & Moss',       'caps',      '&',  null,           90),
  ('Obsidian.',           'display',   null, null,           80),
  ('APEX',                'minimal',   null, '— Lounge —',   70),
  ('Cacao Archive',       'smallcaps', null, null,           60),
  ('Vellum',              'bracket',   null, null,           50),
  ('The Gilded Cask',     'serif',     '❋',  null,           40),
  ('Zenith',              'heavy',     null, null,           30),
  ('Ether · Café',        'caps',      '◆',  null,           20),
  ('Blue Note Tavern',    'smallcaps', null, null,           15),
  ('Juniper · Kitchen',   'display',   '·',  null,           10),
  ('SAVOIR',              'minimal',   null, '— Atelier —',   5)
) as v(label, variant, mark, subline, display_order)
where not exists (select 1 from public.client_logos);

create table if not exists public.member_favourites (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null,
  description    text,
  benefit        text not null,
  image_url      text,
  display_order  integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists member_favourites_order_idx
  on public.member_favourites (display_order desc, created_at);

alter table public.member_favourites enable row level security;

drop policy if exists "member_favourites_public_read"  on public.member_favourites;
drop policy if exists "member_favourites_admin_insert" on public.member_favourites;
drop policy if exists "member_favourites_admin_update" on public.member_favourites;
drop policy if exists "member_favourites_admin_delete" on public.member_favourites;

create policy "member_favourites_public_read"
  on public.member_favourites for select
  using (is_published = true);

create policy "member_favourites_admin_insert"
  on public.member_favourites for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

create policy "member_favourites_admin_update"
  on public.member_favourites for update to authenticated
  using       (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true))
  with check  (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

create policy "member_favourites_admin_delete"
  on public.member_favourites for delete to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

insert into public.member_favourites (name, category, description, benefit, display_order)
select * from (values
  ('Blue Note Tavern',   'Jazz · Old fashioneds',         'Authentic jazz programming and a vintage cocktail catalogue, run by a former Mayfair bar manager.', 'Priority booking + first drink', 30),
  ('The Gilded Fork',    'Tasting menu · French',         'Modern culinary artistry, classically trained technique. Chef''s table available on request to members.', '20% off tasting menu',           20),
  ('Zenith Performance', 'Wellness · Private training',   'Elite wellness facility with private training suites and recovery rooms reserved for members.', 'Waived membership fees',         10)
) as v(name, category, description, benefit, display_order)
where not exists (select 1 from public.member_favourites);

create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_client_logos_updated      on public.client_logos;
create trigger trg_client_logos_updated      before update on public.client_logos      for each row execute function public.set_updated_at();

drop trigger if exists trg_member_favourites_updated on public.member_favourites;
create trigger trg_member_favourites_updated before update on public.member_favourites for each row execute function public.set_updated_at();


-- ============================================================
-- 006 — DRIFT: drift_djs + drift_events + drift storage bucket
-- ============================================================
create table if not exists public.drift_djs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  alias          text,
  tagline        text,
  bio            text,
  credentials    text,
  image_url      text,
  instagram_url  text,
  soundcloud_url text,
  genres         text[] not null default '{}',
  display_order  integer not null default 0,
  is_resident    boolean not null default true,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists drift_djs_order_idx
  on public.drift_djs (display_order desc, created_at);

alter table public.drift_djs enable row level security;

drop policy if exists "drift_djs_public_read"  on public.drift_djs;
drop policy if exists "drift_djs_admin_insert" on public.drift_djs;
drop policy if exists "drift_djs_admin_update" on public.drift_djs;
drop policy if exists "drift_djs_admin_delete" on public.drift_djs;

create policy "drift_djs_public_read"
  on public.drift_djs for select
  using (is_published = true);

create policy "drift_djs_admin_insert"
  on public.drift_djs for insert to authenticated
  with check (public.is_admin());

create policy "drift_djs_admin_update"
  on public.drift_djs for update to authenticated
  using       (public.is_admin())
  with check  (public.is_admin());

create policy "drift_djs_admin_delete"
  on public.drift_djs for delete to authenticated
  using (public.is_admin());

drop policy if exists "drift_djs_admin_read_all" on public.drift_djs;
create policy "drift_djs_admin_read_all"
  on public.drift_djs for select to authenticated
  using (public.is_admin());

insert into public.drift_djs (name, alias, tagline, bio, credentials, genres, display_order)
select * from (values
  ('Ananya Sen',  'Soft Static',   'Selector · House & downtempo', 'Late-set staple with a feel for slow builds and warm rooms.',     'Resident at Boiler Room Delhi (2022, 2024). Sets at Magnetic Fields, Sunburn Afterglow, Berlin''s Sameheads.', array['House','Downtempo','Acid'],   100),
  ('Kabir Joshi', 'Maitri',        'Selector · Deep & dub',         'Spins long arcs of dub-house with handpicked vinyl-only sets.',  'Boiler Room Mumbai (2023). Aravali Sessions, Goa. Long-time resident at Auro Kitchen & Bar.',            array['Deep House','Dub'],          90),
  ('Maya R.',     'Maya R.',       'Selector · Italo & cosmic',     'Italo, cosmic disco and a soft spot for the seven-minute edit.', 'Played alongside DJ Harvey at Auro. Long-running monthly at SAGA, Mumbai. Mix series with NTS.',         array['Italo','Cosmic Disco','Edits'], 80)
) as v(name, alias, tagline, bio, credentials, genres, display_order)
where not exists (select 1 from public.drift_djs);

create table if not exists public.drift_events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  subtitle       text,
  event_date     timestamptz,
  venue_name     text not null,
  venue_area     text,
  city           text not null default 'Delhi',
  cover_image_url text,
  description    text,
  lineup         text[] not null default '{}',
  ticket_url     text,
  is_past        boolean not null default false,      -- maintained by trg_drift_events_is_past
  is_published   boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists drift_events_date_idx
  on public.drift_events (event_date desc);
create index if not exists drift_events_published_idx
  on public.drift_events (is_published, event_date);

alter table public.drift_events enable row level security;

drop policy if exists "drift_events_public_read"  on public.drift_events;
drop policy if exists "drift_events_admin_insert" on public.drift_events;
drop policy if exists "drift_events_admin_update" on public.drift_events;
drop policy if exists "drift_events_admin_delete" on public.drift_events;
drop policy if exists "drift_events_admin_read_all" on public.drift_events;

create policy "drift_events_public_read"
  on public.drift_events for select
  using (is_published = true);

create policy "drift_events_admin_read_all"
  on public.drift_events for select to authenticated
  using (public.is_admin());

create policy "drift_events_admin_insert"
  on public.drift_events for insert to authenticated
  with check (public.is_admin());

create policy "drift_events_admin_update"
  on public.drift_events for update to authenticated
  using       (public.is_admin())
  with check  (public.is_admin());

create policy "drift_events_admin_delete"
  on public.drift_events for delete to authenticated
  using (public.is_admin());

-- Keep is_past in sync. A STORED generated column can't be used (its expression
-- must be IMMUTABLE; now() is only STABLE) — a trigger maintains the flag, and
-- is created before the seed so seeded rows get the correct value.
create or replace function public.drift_events_set_is_past() returns trigger as $$
begin
  new.is_past := (new.event_date is not null and new.event_date < now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_drift_events_is_past on public.drift_events;
create trigger trg_drift_events_is_past
  before insert or update on public.drift_events
  for each row execute function public.drift_events_set_is_past();

insert into public.drift_events (title, subtitle, event_date, venue_name, venue_area, city, description, lineup, display_order)
select * from (values
  ('Velvet Hours · Vol. III', 'This Saturday', (now() + interval '8 days')::timestamptz, 'The Velvet Botanist', 'Mayfair',  'London', 'A late-set rotation across the back bar — slow house, low light, and a single warm spotlight on the booth.', array['Ananya Sen','Kabir Joshi','b2b Maya R.'], 100),
  ('Obsidian Hours · Vol. II', null,           (now() - interval '60 days')::timestamptz,'Obsidian',            'Bandra',   'Mumbai', 'A cellar set, condensation on the glass, four hours.',                                                       array['Maya R.','Kabir Joshi'],                  90)
) as v(title, subtitle, event_date, venue_name, venue_area, city, description, lineup, display_order)
where not exists (select 1 from public.drift_events);

drop trigger if exists trg_drift_djs_updated    on public.drift_djs;
create trigger trg_drift_djs_updated    before update on public.drift_djs    for each row execute function public.set_updated_at();

drop trigger if exists trg_drift_events_updated on public.drift_events;
create trigger trg_drift_events_updated before update on public.drift_events for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('drift', 'drift', true)
on conflict (id) do update set public = true;

drop policy if exists "drift_public_read" on storage.objects;
create policy "drift_public_read"
  on storage.objects for select
  using (bucket_id = 'drift');

drop policy if exists "drift_admin_insert" on storage.objects;
create policy "drift_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'drift' and public.is_admin());

drop policy if exists "drift_admin_update" on storage.objects;
create policy "drift_admin_update"
  on storage.objects for update to authenticated
  using       (bucket_id = 'drift' and public.is_admin())
  with check  (bucket_id = 'drift' and public.is_admin());

drop policy if exists "drift_admin_delete" on storage.objects;
create policy "drift_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'drift' and public.is_admin());

-- ============================================================
-- 007 — site_content: generic per-section editable copy
-- ============================================================
create table if not exists public.site_content (
  id            uuid primary key default gen_random_uuid(),
  page          text not null,
  section       text not null,
  item_key      text not null,
  label         text not null,
  value         text,
  kind          text not null default 'text'
                  check (kind in ('text','longtext','image')),
  display_order integer not null default 0,
  updated_at    timestamptz not null default now(),
  unique (page, section, item_key)
);

create index if not exists site_content_page_idx
  on public.site_content (page, display_order);

alter table public.site_content enable row level security;

drop policy if exists "site_content_public_read"  on public.site_content;
drop policy if exists "site_content_admin_insert" on public.site_content;
drop policy if exists "site_content_admin_update" on public.site_content;
drop policy if exists "site_content_admin_delete" on public.site_content;

create policy "site_content_public_read"
  on public.site_content for select using (true);
create policy "site_content_admin_insert"
  on public.site_content for insert to authenticated with check (public.is_admin());
create policy "site_content_admin_update"
  on public.site_content for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "site_content_admin_delete"
  on public.site_content for delete to authenticated using (public.is_admin());

drop trigger if exists trg_site_content_updated on public.site_content;
create trigger trg_site_content_updated
  before update on public.site_content
  for each row execute function public.set_updated_at();

--  The seed for site_content is large; run build/db/007_site_content.sql
--  in full to populate every editable field. (This block creates the
--  table so the Admin → Content tab works; the seed fills it.)

-- ============================================================
--  Done. Verify in Table Editor: you should now see client_logos,
--  member_favourites, drift_djs, drift_events, site_content.
--  Then run 007_site_content.sql to seed the Content tab.
-- ============================================================
