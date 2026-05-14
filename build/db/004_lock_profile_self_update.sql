-- Juniper Club — Phase 1.6: lock down profile self-edits
-- Without this, a signed-in member can PATCH their own row and set
-- subscription_tier = 'platinum' or subscription_status = 'active'.
-- Run AFTER 001_schema.sql. Idempotent.

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
