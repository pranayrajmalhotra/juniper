-- Juniper Club — initial schema
-- Run this in Supabase SQL editor (Project → SQL Editor → New query) BEFORE 002_seed_venues.sql.

-- =========================================
--  profiles  (extends auth.users)
-- =========================================
create table if not exists public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  email                text unique not null,
  full_name            text,
  is_admin             boolean not null default false,
  subscription_status  text    not null default 'inactive'   -- 'active' | 'inactive' | 'expired'
                       check (subscription_status in ('active','inactive','expired')),
  subscription_tier    text    not null default 'standard'   -- 'standard' | 'gold' | 'platinum'
                       check (subscription_tier in ('standard','gold','platinum')),
  joined_at            timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by RLS: is the calling user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where user_id = auth.uid()), false);
$$;

-- Profile RLS
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "users update own basic profile" on public.profiles;
create policy "users update own basic profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and is_admin = (select is_admin from public.profiles where user_id = auth.uid()));

drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================
--  venues
-- =========================================
create table if not exists public.venues (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  category        text not null,                       -- 'cocktail' | 'speakeasy' | 'lounge' | 'wine' | 'gastropub'
  area            text not null,                       -- 'Khan Market', 'Connaught Place', etc.
  city            text not null default 'Delhi',
  description     text,
  image_url       text,
  perks           jsonb not null default '[]'::jsonb,   -- e.g. ["20% off bills", "priority booking"]
  is_featured     boolean not null default false,
  is_published    boolean not null default true,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.venues enable row level security;

-- Anyone (signed-in or not) can read PUBLISHED venues
drop policy if exists "anyone reads published venues" on public.venues;
create policy "anyone reads published venues"
  on public.venues for select
  using (is_published);

-- Admins can read everything (including unpublished drafts)
drop policy if exists "admins read all venues" on public.venues;
create policy "admins read all venues"
  on public.venues for select
  using (public.is_admin());

-- Admin-only write
drop policy if exists "admins insert venues" on public.venues;
create policy "admins insert venues"
  on public.venues for insert
  with check (public.is_admin());

drop policy if exists "admins update venues" on public.venues;
create policy "admins update venues"
  on public.venues for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete venues" on public.venues;
create policy "admins delete venues"
  on public.venues for delete
  using (public.is_admin());

-- updated_at maintenance
create or replace function public.bump_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bump_venues_updated_at on public.venues;
create trigger bump_venues_updated_at
  before update on public.venues
  for each row execute function public.bump_updated_at();

drop trigger if exists bump_profiles_updated_at on public.profiles;
create trigger bump_profiles_updated_at
  before update on public.profiles
  for each row execute function public.bump_updated_at();

-- Helpful indexes
create index if not exists venues_published_order_idx on public.venues (is_published, display_order desc);
create index if not exists venues_category_idx        on public.venues (category);
create index if not exists venues_area_idx            on public.venues (area);

-- =========================================
--  Promote your first admin
--  (run this AFTER you sign up your own account)
--
--  update public.profiles
--    set is_admin = true,
--        subscription_status = 'active',
--        subscription_tier = 'platinum'
--    where email = 'YOUR_EMAIL@example.com';
-- =========================================
