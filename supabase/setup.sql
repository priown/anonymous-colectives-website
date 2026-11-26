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
alter table public.products enable row level security;

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

-- products: everyone reads; writes only through save_products().
drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products
  for select
  to public
  using (true);

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
-- Upsert one or more product rows after checking the admin password.
-- ---------------------------------------------------------------------------
create or replace function public.save_products(
  p_username text,
  p_password text,
  p_products jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  item jsonb;
begin
  if not exists (
    select 1
    from public.users
    where username = p_username
      and password_hash = crypt(p_password, password_hash)
  ) then
    raise exception 'Incorrect username or password' using errcode = '28P01';
  end if;

  for item in select jsonb_array_elements(p_products) loop
    insert into public.products (
      id, title, category, gender, description, motto,
      pictures, colours, sizes,
      actual_price, discount_price, quantity,
      available, availability_note,
      is_new_arrival, is_best_seller, is_featured, is_top_recommended,
      collection, date_added, sort_order, updated_at
    )
    values (
      item->>'id',
      item->>'title',
      item->>'category',
      item->>'gender',
      item->>'description',
      nullif(item->>'motto', ''),
      coalesce(item->'pictures', '[]'::jsonb),
      coalesce(item->'colours', '[]'::jsonb),
      coalesce(item->'sizes', '[]'::jsonb),
      coalesce((item->>'actualPrice')::int, 0),
      nullif(item->>'discountPrice', '')::int,
      coalesce((item->>'quantity')::int, 0),
      coalesce((item->>'available')::boolean, true),
      nullif(item->>'availabilityNote', ''),
      coalesce((item->>'isNewArrival')::boolean, false),
      coalesce((item->>'isBestSeller')::boolean, false),
      coalesce((item->>'isFeatured')::boolean, false),
      coalesce((item->>'isTopRecommended')::boolean, false),
      item->>'collection',
      coalesce(nullif(item->>'dateAdded', ''), to_char(now(), 'YYYY-MM-DD')),
      coalesce((item->>'sortOrder')::int, 0),
      now()
    )
    on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      gender = excluded.gender,
      description = excluded.description,
      motto = excluded.motto,
      pictures = excluded.pictures,
      colours = excluded.colours,
      sizes = excluded.sizes,
      actual_price = excluded.actual_price,
      discount_price = excluded.discount_price,
      quantity = excluded.quantity,
      available = excluded.available,
      availability_note = excluded.availability_note,
      is_new_arrival = excluded.is_new_arrival,
      is_best_seller = excluded.is_best_seller,
      is_featured = excluded.is_featured,
      is_top_recommended = excluded.is_top_recommended,
      collection = excluded.collection,
      date_added = excluded.date_added,
      sort_order = excluded.sort_order,
      updated_at = now();
  end loop;
end;
$$;

revoke execute on function public.save_products(text, text, jsonb) from public;
grant execute on function public.save_products(text, text, jsonb) to anon, authenticated;

create or replace function public.delete_product(
  p_username text,
  p_password text,
  p_id text
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

  delete from public.products where id = p_id;
end;
$$;

revoke execute on function public.delete_product(text, text, text) from public;
grant execute on function public.delete_product(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime updates so open tabs refresh when the admin saves.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.storefront;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.products;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Data API grants. RLS still decides row visibility.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.storefront to anon, authenticated;
grant select on public.products to anon, authenticated;
revoke all on public.users from anon, authenticated;
