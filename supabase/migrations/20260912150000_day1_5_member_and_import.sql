-- Day 1.5 — Internal Buzl Profile JSON Import with Buzl Member Support

-- 1. Add member_id to profiles (unique when populated, nullable)
alter table public.profiles
  add column if not exists member_id text unique check (member_id is null or member_id ~ '^[A-Za-z0-9_-]{3,32}$');

-- 2. Define is_buzl_member helper function
create or replace function public.is_buzl_member()
returns boolean language sql stable security invoker set search_path = pg_catalog
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'buzl_member'), false); $$;

grant execute on function public.is_buzl_member() to anon, authenticated;

-- 3. Dedicated admin function to safely set member_id
create or replace function public.set_member_id(target_user_id uuid, p_member_id text)
returns void language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if not public.is_admin() then
    raise exception 'admin role required to assign member_id';
  end if;
  update public.profiles set member_id = p_member_id where id = target_user_id;
  if not found then
    raise exception 'profile not found';
  end if;
end;
$$;

grant execute on function public.set_member_id(uuid, text) to authenticated;

-- 4. Add provenance and legacy source tracking columns to businesses
alter table public.businesses
  add column if not exists source_record_id text check (char_length(source_record_id) <= 120),
  add column if not exists source_buss_id text check (char_length(source_buss_id) <= 120),
  add column if not exists source_loc_id text check (char_length(source_loc_id) <= 120),
  add column if not exists source_place_id text check (char_length(source_place_id) <= 120),
  add column if not exists imported_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists imported_by_member_id text check (char_length(imported_by_member_id) <= 32);

create index if not exists businesses_source_buss_id_idx on public.businesses (source_buss_id) where source_buss_id is not null;
create index if not exists businesses_source_loc_id_idx on public.businesses (source_loc_id) where source_loc_id is not null;
create index if not exists businesses_source_place_id_idx on public.businesses (source_place_id) where source_place_id is not null;

grant update (source_record_id, source_buss_id, source_loc_id, source_place_id, imported_by_user_id, imported_by_member_id, created_source) on public.businesses to authenticated;
