-- Migration: 20260917200000_google_places_location.sql
-- Description: Add place_id to public.businesses, partial index, grant update,
-- and update create_business_for_current_user RPC to support p_place_id.

alter table public.businesses
  add column if not exists place_id text check (place_id is null or char_length(btrim(place_id)) between 1 and 255);

create index if not exists businesses_place_id_idx
  on public.businesses (place_id)
  where place_id is not null;

grant update (place_id) on public.businesses to authenticated;

-- Drop older 15-parameter overload so PostgreSQL does not have ambiguous default-argument resolution
drop function if exists public.create_business_for_current_user(
  text, text, uuid, public.location_mode, text, text, text, char(2), text, text, text, text, boolean, numeric, numeric
);

-- Update create_business_for_current_user RPC with p_place_id
create or replace function public.create_business_for_current_user(
  p_canonical_name text,
  p_primary_phone text,
  p_primary_category_id uuid,
  p_location_mode public.location_mode,
  p_city text,
  p_state text,
  p_country text,
  p_country_code char(2) default 'IN',
  p_address_line_1 text default null,
  p_address_line_2 text default null,
  p_locality text default null,
  p_postal_code text default null,
  p_show_street_address boolean default false,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_place_id text default null
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  new_business_id uuid;
begin
  if auth.uid() is null or not public.is_account_active() then
    raise exception 'active account required';
  end if;

  if not exists (select 1 from public.categories where id = p_primary_category_id and active) then
    raise exception 'primary category must be active';
  end if;

  if (p_latitude is null) <> (p_longitude is null) or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'a valid latitude and longitude pair is required when a map point is supplied';
  end if;

  insert into public.businesses (
    canonical_name,
    slug,
    primary_phone,
    primary_phone_normalized,
    primary_category_id,
    location_mode,
    city,
    state,
    country,
    country_code,
    address_line_1,
    address_line_2,
    locality,
    postal_code,
    show_street_address,
    geo_point,
    place_id,
    created_by
  )
  values (
    p_canonical_name,
    'pending-derived-slug',
    p_primary_phone,
    '0000000',
    p_primary_category_id,
    p_location_mode,
    p_city,
    p_state,
    p_country,
    upper(p_country_code),
    p_address_line_1,
    p_address_line_2,
    p_locality,
    p_postal_code,
    p_show_street_address,
    case when p_latitude is null then null else extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography end,
    p_place_id,
    auth.uid()
  )
  returning id into new_business_id;

  insert into public.business_managers (business_id, user_id, role)
  values (new_business_id, auth.uid(), 'owner');

  return new_business_id;
end;
$$;

grant execute on function public.create_business_for_current_user(
  text, text, uuid, public.location_mode, text, text, text, char(2), text, text, text, text, boolean, numeric, numeric, text
) to authenticated;
