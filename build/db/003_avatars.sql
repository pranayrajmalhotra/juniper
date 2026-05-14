-- Juniper Club — Phase 1.5: avatar uploads
-- Run this in Supabase SQL Editor AFTER 001_schema.sql.
-- It is idempotent — safe to re-run.

-- =========================================
--  1. profiles.avatar_url
-- =========================================
alter table public.profiles
  add column if not exists avatar_url text;

-- =========================================
--  2. avatars storage bucket (public read)
-- =========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- =========================================
--  3. RLS on storage.objects for the avatars bucket.
--     Convention: every uploaded path starts with "<user_id>/..."
--     so we use the first folder segment as the owner check.
-- =========================================

-- Anyone can read avatars (bucket is public anyway, but make it explicit
-- so signed/public URLs both work without surprises).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users may upload to their own folder only.
drop policy if exists "avatars_user_insert_own" on storage.objects;
create policy "avatars_user_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may overwrite (upsert) their own avatar.
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

-- Users may delete their own avatar.
drop policy if exists "avatars_user_delete_own" on storage.objects;
create policy "avatars_user_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
