-- =============================================================================
-- Anonymous Collectives — Supabase setup
--
-- Run this once in the Supabase SQL Editor (or via the DB connection string)
-- AFTER `drizzle-kit push` has created the tables. It adds:
--   1. row-level security + policies for `storefront` and `users`
--   2. the public storage bucket
--   3. realtime updates for open browsers
--   4. Data API grants for the anon/authenticated roles
--
-- The admin email below must match VITE_ADMIN_EMAIL (default shown).
-- =============================================================================

-- Live storefront state table (columns must match src/db/schema.ts).
create table if not exists public.storefront (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.storefront enable row level security;
alter table public.users enable row level security;

-- ---------------------------------------------------------------------------
-- storefront: everyone reads, only the admin writes
-- ---------------------------------------------------------------------------
drop policy if exists "storefront public read" on public.storefront;
create policy "storefront public read"
  on public.storefront
  for select
  to public
  using (true);

drop policy if exists "storefront admin write" on public.storefront;
create policy "storefront admin write"
  on public.storefront
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local')
  with check ((auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local');

-- ---------------------------------------------------------------------------
-- users: a signed-in user can manage only their own profile row
-- ---------------------------------------------------------------------------
drop policy if exists "users own profile" on public.users;
create policy "users own profile"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "users insert own profile" on public.users;
create policy "users insert own profile"
  on public.users
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "users update own profile" on public.users;
create policy "users update own profile"
  on public.users
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Realtime updates so open tabs refresh when the admin saves
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.storefront;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Public image bucket (kept for future Supabase Storage use; uploads currently
-- go to Cloudinary)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('storefront', 'storefront', true)
on conflict (id) do update set public = true;

drop policy if exists "storefront images public read" on storage.objects;
create policy "storefront images public read"
  on storage.objects
  for select
  using (bucket_id = 'storefront');

drop policy if exists "storefront images admin insert" on storage.objects;
create policy "storefront images admin insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'storefront'
    and (auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local'
  );

drop policy if exists "storefront images admin update" on storage.objects;
create policy "storefront images admin update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'storefront'
    and (auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local'
  )
  with check (
    bucket_id = 'storefront'
    and (auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local'
  );

drop policy if exists "storefront images admin delete" on storage.objects;
create policy "storefront images admin delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'storefront'
    and (auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local'
  );

-- ---------------------------------------------------------------------------
-- Data API access for the roles (RLS still decides which rows are visible)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.storefront to anon, authenticated;
revoke all on public.users from anon;
grant select, insert, update on public.users to authenticated;
