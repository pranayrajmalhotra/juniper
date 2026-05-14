-- Juniper Club — Phase 2: editable content sections
-- Tables: client_logos, member_favourites
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. client_logos — partner-logo marquee shown on index & directory
-- ============================================================
create table if not exists public.client_logos (
  id             uuid primary key default gen_random_uuid(),
  label          text not null,                                                   -- visible wordmark text
  variant        text not null default 'serif' check (variant in (
                   'serif', 'display', 'caps', 'minimal', 'smallcaps', 'heavy', 'bracket'
                 )),
  mark           text,                                                            -- optional unicode glyph (✦, ◆, etc.)
  subline        text,                                                            -- used by 'minimal' variant
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

-- Seed with the current dummy partner set if empty
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

-- ============================================================
-- 2. member_favourites — the editorial "Quietly, enduringly, ours." list on home
-- ============================================================
create table if not exists public.member_favourites (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null,                  -- "Jazz · Old fashioneds"
  description    text,                           -- shown on desktop only
  benefit        text not null,                  -- "Priority booking + first drink"
  image_url      text,                           -- optional
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

-- Seed with the three current static favourites if empty
insert into public.member_favourites (name, category, description, benefit, display_order)
select * from (values
  ('Blue Note Tavern',   'Jazz · Old fashioneds',         'Authentic jazz programming and a vintage cocktail catalogue, run by a former Mayfair bar manager.', 'Priority booking + first drink', 30),
  ('The Gilded Fork',    'Tasting menu · French',         'Modern culinary artistry, classically trained technique. Chef''s table available on request to members.', '20% off tasting menu',           20),
  ('Zenith Performance', 'Wellness · Private training',   'Elite wellness facility with private training suites and recovery rooms reserved for members.', 'Waived membership fees',         10)
) as v(name, category, description, benefit, display_order)
where not exists (select 1 from public.member_favourites);

-- ============================================================
-- 3. Keep updated_at fresh on row update
-- ============================================================
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_client_logos_updated      on public.client_logos;
create trigger trg_client_logos_updated      before update on public.client_logos      for each row execute function public.set_updated_at();

drop trigger if exists trg_member_favourites_updated on public.member_favourites;
create trigger trg_member_favourites_updated before update on public.member_favourites for each row execute function public.set_updated_at();
