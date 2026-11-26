-- =============================================================================
-- Anonymous Collectives — Supabase setup
--
-- Run this once in the Supabase SQL Editor. It creates:
--   1. the single storefront state row (prices, photo list, homepage choices)
--   2. public read + admin-only write rules
--   3. realtime updates for open browsers
--   4. a public storage bucket and its access rules
--
-- The admin email below must match VITE_ADMIN_EMAIL (default shown).
-- =============================================================================

create table if not exists public.storefront (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.storefront enable row level security;

drop policy if exists "storefront public read" on public.storefront;
create policy "storefront public read"
  on public.storefront
  for select
  using (true);

drop policy if exists "storefront admin write" on public.storefront;
create policy "storefront admin write"
  on public.storefront
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local')
  with check ((auth.jwt() ->> 'email') = 'admin@anonymous-collectives.local');

-- Realtime updates so open tabs refresh when the admin saves.
do $$
begin
  alter publication supabase_realtime add table public.storefront;
exception
  when duplicate_object then null;
end $$;

-- Public image bucket. Anyone can read; only the admin can write.
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
