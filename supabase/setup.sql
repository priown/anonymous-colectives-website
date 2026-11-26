-- =============================================================================
-- Anonymous Collectives — Supabase setup (no Supabase Auth)
--
-- Run after `drizzle-kit push` has created the tables. This file adds:
--   1. RLS on `users` and `storefront`
--   2. server-side password checks (pgcrypto)
--   3. login + save_storefront RPCs callable with the anon key
--   4. Data API grants and realtime
--
-- Default admin row (created/seeded separately):
--   username: Admin
--   password: Admin
-- =============================================================================

create extension if not exists pgcrypto;

-- Live storefront state table (columns must match src/db/schema.ts).
create table if not exists public.storefront (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.storefront enable row level security;

-- ---------------------------------------------------------------------------
-- storefront: everyone reads. Writes only happen through save_storefront().
-- ---------------------------------------------------------------------------
drop policy if exists "storefront public read" on public.storefront;
create policy "storefront public read"
  on public.storefront
  for select
  to public
  using (true);

-- Remove any old write policies: the RPC is the only write path.
drop policy if exists "storefront admin write" on public.storefront;

-- ---------------------------------------------------------------------------
-- users: private. Password hashes are never readable by anon/authenticated.
-- The SECURITY DEFINER functions below read the table.
-- ---------------------------------------------------------------------------
drop policy if exists "users own profile" on public.users;
drop policy if exists "users insert own profile" on public.users;
drop policy if exists "users update own profile" on public.users;

-- ---------------------------------------------------------------------------
-- Server-side password check. Returns true/false only.
-- ---------------------------------------------------------------------------
create or replace function public.login(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return exists (
    select 1
    from public.users
    where username = p_username
      and password_hash = crypt(p_password, password_hash)
  );
end;
$$;

revoke execute on function public.login(text, text) from public;
grant execute on function public.login(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verify credentials, then write the single storefront row.
-- ---------------------------------------------------------------------------
create or replace function public.save_storefront(
  p_username text,
  p_password text,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1
    from public.users
    where username = p_username
      and password_hash = crypt(p_password, password_hash)
  ) then
    raise exception 'Incorrect username or password' using errcode = '28P01';
  end if;

  insert into public.storefront (id, data, updated_at)
  values ('main', p_data, now())
  on conflict (id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at;
end;
$$;

revoke execute on function public.save_storefront(text, text, jsonb) from public;
grant execute on function public.save_storefront(text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime updates so open tabs refresh when the admin saves.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.storefront;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Data API grants. RLS still decides row visibility.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.storefront to anon, authenticated;
revoke all on public.users from anon, authenticated;
