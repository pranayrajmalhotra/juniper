-- Juniper Club — 008: image-based partner logos
-- client_logos moves from styled-text wordmarks to uploaded logo images.
-- Adds image_url, a public 'logos' storage bucket, and clears the demo rows.
-- Idempotent — safe to re-run.

-- 1. image URL column
alter table public.client_logos
  add column if not exists image_url text;

-- 2. variant / mark / subline are legacy text-logo styling — make variant optional
alter table public.client_logos
  alter column variant drop not null;

-- 3. remove the seeded demo text logos (they have no image) for a clean slate
delete from public.client_logos where image_url is null;

-- 4. public 'logos' storage bucket — public read, admin write (mirrors 'drift')
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos_admin_insert" on storage.objects;
create policy "logos_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.is_admin());

drop policy if exists "logos_admin_update" on storage.objects;
create policy "logos_admin_update"
  on storage.objects for update to authenticated
  using       (bucket_id = 'logos' and public.is_admin())
  with check  (bucket_id = 'logos' and public.is_admin());

drop policy if exists "logos_admin_delete" on storage.objects;
create policy "logos_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.is_admin());

-- Done. client_logos now has image_url; upload logos via Admin → Logos.
