-- Juniper Club — DRIFT (after-hours residency)
-- Tables: drift_djs, drift_events  +  storage bucket: drift
-- Idempotent: safe to re-run.
-- Run AFTER 001_schema.sql (depends on public.profiles + public.is_admin()).

-- ============================================================
-- 1. drift_djs — the resident roster
-- ============================================================
create table if not exists public.drift_djs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  alias          text,                        -- stage / DJ name (e.g. "Soft Static")
  tagline        text,                        -- e.g. "Selector · House & downtempo"
  bio            text,                        -- short prose
  credentials    text,                        -- "Resident at Boiler Room Delhi…"
  image_url      text,                        -- supabase storage public URL
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

-- Admins also need to see unpublished rows in the console
drop policy if exists "drift_djs_admin_read_all" on public.drift_djs;
create policy "drift_djs_admin_read_all"
  on public.drift_djs for select to authenticated
  using (public.is_admin());

-- Seed once if empty
insert into public.drift_djs (name, alias, tagline, bio, credentials, genres, display_order)
select * from (values
  ('Ananya Sen',  'Soft Static',   'Selector · House & downtempo', 'Late-set staple with a feel for slow builds and warm rooms.',     'Resident at Boiler Room Delhi (2022, 2024). Sets at Magnetic Fields, Sunburn Afterglow, Berlin''s Sameheads.', array['House','Downtempo','Acid'],   100),
  ('Kabir Joshi', 'Maitri',        'Selector · Deep & dub',         'Spins long arcs of dub-house with handpicked vinyl-only sets.',  'Boiler Room Mumbai (2023). Aravali Sessions, Goa. Long-time resident at Auro Kitchen & Bar.',            array['Deep House','Dub'],          90),
  ('Maya R.',     'Maya R.',       'Selector · Italo & cosmic',     'Italo, cosmic disco and a soft spot for the seven-minute edit.', 'Played alongside DJ Harvey at Auro. Long-running monthly at SAGA, Mumbai. Mix series with NTS.',         array['Italo','Cosmic Disco','Edits'], 80)
) as v(name, alias, tagline, bio, credentials, genres, display_order)
where not exists (select 1 from public.drift_djs);


-- ============================================================
-- 2. drift_events — upcoming + past nights
-- ============================================================
create table if not exists public.drift_events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,                      -- "Velvet Hours · Vol. III"
  subtitle       text,                               -- short tag e.g. "This Saturday"
  event_date     timestamptz,                        -- when it starts
  venue_name     text not null,
  venue_area     text,
  city           text not null default 'Delhi',
  cover_image_url text,
  description    text,
  lineup         text[] not null default '{}',       -- DJ names as displayed
  ticket_url     text,
  is_past        boolean generated always as (event_date is not null and event_date < now()) stored,
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

-- Seed a single upcoming + a single past event so the static fallback never wins
insert into public.drift_events (title, subtitle, event_date, venue_name, venue_area, city, description, lineup, display_order)
select * from (values
  ('Velvet Hours · Vol. III', 'This Saturday', (now() + interval '8 days')::timestamptz, 'The Velvet Botanist', 'Mayfair',  'London', 'A late-set rotation across the back bar — slow house, low light, and a single warm spotlight on the booth.', array['Ananya Sen','Kabir Joshi','b2b Maya R.'], 100),
  ('Obsidian Hours · Vol. II', null,           (now() - interval '60 days')::timestamptz,'Obsidian',            'Bandra',   'Mumbai', 'A cellar set, condensation on the glass, four hours.',                                                       array['Maya R.','Kabir Joshi'],                  90)
) as v(title, subtitle, event_date, venue_name, venue_area, city, description, lineup, display_order)
where not exists (select 1 from public.drift_events);


-- ============================================================
-- 3. Updated-at triggers
-- ============================================================
drop trigger if exists trg_drift_djs_updated    on public.drift_djs;
create trigger trg_drift_djs_updated    before update on public.drift_djs    for each row execute function public.set_updated_at();

drop trigger if exists trg_drift_events_updated on public.drift_events;
create trigger trg_drift_events_updated before update on public.drift_events for each row execute function public.set_updated_at();


-- ============================================================
-- 4. drift storage bucket (public read; admin write)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('drift', 'drift', true)
on conflict (id) do update set public = true;

-- Anyone may read drift uploads
drop policy if exists "drift_public_read" on storage.objects;
create policy "drift_public_read"
  on storage.objects for select
  using (bucket_id = 'drift');

-- Admins may upload / overwrite / delete in the drift bucket
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
