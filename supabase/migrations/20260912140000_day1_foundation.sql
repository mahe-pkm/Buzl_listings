-- Day 1 security foundation.
-- Operational tables are private. Day 2 public pages must use the narrowly
-- projected get_published_business_public() function, never a base-table query.

create extension if not exists pgcrypto;
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create type public.location_mode as enum ('storefront', 'service_area', 'hybrid');
create type public.publication_status as enum ('draft', 'pending', 'published', 'rejected', 'suspended', 'archived');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'failed');
create type public.manager_role as enum ('owner');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Authorization is auth.jwt() app_metadata.role; profiles has no role column.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  parent_id uuid references public.categories(id) on delete restrict,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null check (char_length(btrim(canonical_name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 5000),
  year_established integer check (year_established between 1000 and extract(year from now())::integer),
  primary_phone text not null check (char_length(btrim(primary_phone)) between 7 and 32),
  primary_phone_normalized text not null check (primary_phone_normalized ~ '^[0-9]{7,20}$'),
  alternate_phone text check (char_length(alternate_phone) <= 32),
  whatsapp_phone text check (char_length(whatsapp_phone) <= 32),
  business_contact_email text check (business_contact_email is null or business_contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  show_email boolean not null default false,
  website_url text check (website_url is null or website_url ~* '^https?://'),
  website_domain_normalized text,
  primary_category_id uuid not null references public.categories(id) on delete restrict,
  location_mode public.location_mode not null,
  address_line_1 text check (char_length(address_line_1) <= 160),
  address_line_2 text check (char_length(address_line_2) <= 160),
  locality text check (char_length(locality) <= 100),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  district text check (char_length(district) <= 100),
  state text not null check (char_length(btrim(state)) between 1 and 100),
  country text not null check (char_length(btrim(country)) between 1 and 100),
  country_code char(2) not null default 'IN' check (country_code ~ '^[A-Z]{2}$'),
  postal_code text check (postal_code is null or postal_code ~ '^[A-Za-z0-9 -]{3,20}$'),
  show_street_address boolean not null default false,
  geo_point extensions.geography(point, 4326),
  facebook_url text check (facebook_url is null or facebook_url ~* '^https?://'),
  instagram_url text check (instagram_url is null or instagram_url ~* '^https?://'),
  linkedin_url text check (linkedin_url is null or linkedin_url ~* '^https?://'),
  youtube_url text check (youtube_url is null or youtube_url ~* '^https?://'),
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'unverified',
  created_source text not null default 'buzl_client' check (created_source in ('buzl_admin', 'buzl_client', 'trusted_import')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (location_mode <> 'service_area' or not show_street_address)
);

create table public.business_managers (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.manager_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_name text not null check (char_length(btrim(service_name)) between 1 and 120),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, service_name)
);

create table public.business_service_areas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  city text check (char_length(city) <= 100),
  state text check (char_length(state) <= 100),
  country text check (char_length(country) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  is_24_hours boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (is_closed and is_24_hours)),
  check ((is_closed or is_24_hours) or (opens_at is not null and closes_at is not null)),
  check (is_closed or is_24_hours or opens_at < closes_at)
);

create table public.business_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('logo', 'cover')),
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  byte_size integer not null check (byte_size between 1 and 5242880),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, kind),
  unique (storage_path)
);

create table public.slug_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create index businesses_primary_phone_normalized_idx on public.businesses (primary_phone_normalized);
create index businesses_website_domain_normalized_idx on public.businesses (website_domain_normalized) where website_domain_normalized is not null;
create index businesses_publication_status_idx on public.businesses (publication_status);
create index businesses_primary_category_idx on public.businesses (primary_category_id);
create index business_managers_user_business_idx on public.business_managers (user_id, business_id);
create index business_service_areas_business_idx on public.business_service_areas (business_id);

create function public.is_admin()
returns boolean language sql stable security invoker set search_path = pg_catalog
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); $$;

create function public.is_business_manager(target_business_id uuid)
returns boolean language sql stable security invoker set search_path = pg_catalog
as $$
  select exists (select 1 from public.business_managers manager where manager.business_id = target_business_id and manager.user_id = auth.uid());
$$;

create function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = pg_catalog
as $$ begin new.updated_at = now(); return new; end; $$;

create function public.slug_base(input text)
returns text language sql immutable security invoker set search_path = pg_catalog
as $$ select trim(both '-' from regexp_replace(lower(btrim(input)), '[^a-z0-9]+', '-', 'g')); $$;

create function public.unique_business_slug(input text, exclude_business_id uuid default null)
returns text language plpgsql security definer set search_path = pg_catalog
as $$
declare base_slug text := public.slug_base(input); candidate text; suffix integer := 1;
begin
  if base_slug = '' then raise exception 'business name cannot produce an empty slug'; end if;
  candidate := base_slug;
  while exists (select 1 from public.businesses where slug = candidate and id is distinct from exclude_business_id)
     or exists (select 1 from public.slug_history where slug = candidate) loop
    suffix := suffix + 1; candidate := base_slug || '-' || suffix;
  end loop;
  return candidate;
end;
$$;

create function public.derive_business_fields()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
begin
  new.canonical_name = btrim(new.canonical_name);
  new.primary_phone_normalized = regexp_replace(new.primary_phone, '[^0-9]', '', 'g');
  if new.primary_phone_normalized !~ '^[0-9]{7,20}$' then raise exception 'primary phone must contain between 7 and 20 digits'; end if;
  new.website_domain_normalized = case when nullif(btrim(coalesce(new.website_url, '')), '') is null then null else lower(regexp_replace(split_part(regexp_replace(new.website_url, '^https?://', '', 'i'), '/', 1), '^www\.', '')) end;
  if tg_op = 'INSERT' or new.canonical_name is distinct from old.canonical_name then
    if tg_op = 'UPDATE' and old.slug is not null then insert into public.slug_history (business_id, slug) values (old.id, old.slug) on conflict (slug) do nothing; end if;
    new.slug = public.unique_business_slug(new.canonical_name, case when tg_op = 'UPDATE' then old.id else null end);
  end if;
  return new;
end;
$$;

create trigger businesses_derive_fields before insert or update of canonical_name, primary_phone, website_url on public.businesses for each row execute function public.derive_business_fields();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger business_services_set_updated_at before update on public.business_services for each row execute function public.set_updated_at();
create trigger business_service_areas_set_updated_at before update on public.business_service_areas for each row execute function public.set_updated_at();
create trigger business_hours_set_updated_at before update on public.business_hours for each row execute function public.set_updated_at();
create trigger business_media_set_updated_at before update on public.business_media for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
begin
  insert into public.profiles (id, full_name) values (new.id, nullif(left(new.raw_user_meta_data ->> 'full_name', 120), '')) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.assert_business_publishable(target_business_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog
as $$
declare record public.businesses%rowtype;
begin
  select * into record from public.businesses where id = target_business_id;
  if not found then raise exception 'business not found'; end if;
  if not exists (select 1 from public.categories where id = record.primary_category_id and active) then raise exception 'an active primary category is required'; end if;
  if record.location_mode in ('storefront', 'hybrid') and (record.address_line_1 is null or record.locality is null or record.city is null or record.state is null or record.country is null or record.postal_code is null or not record.show_street_address or record.geo_point is null) then raise exception 'storefront publication requires a public address, locality, city, state, country, postal code, and map point'; end if;
  if record.location_mode in ('service_area', 'hybrid') and not exists (select 1 from public.business_service_areas where business_id = record.id) then raise exception 'service-area publication requires at least one named service area'; end if;
end;
$$;

-- Published records stay publishable after later edits. The business trigger
-- covers address/category/mode changes; the related-table trigger prevents a
-- published service-area or hybrid record from losing its final named area.
create function public.enforce_published_business_integrity()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
declare target_business_id uuid;
begin
  if tg_table_name = 'businesses' then
    target_business_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    target_business_id := case when tg_op = 'DELETE' then old.business_id else new.business_id end;
  end if;
  if exists (select 1 from public.businesses where id = target_business_id and publication_status = 'published') then
    perform public.assert_business_publishable(target_business_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Related records never change parent business in place. This keeps ownership
-- boundaries stable and prevents an UPDATE from moving a final service area
-- away from an already-published service-area or hybrid listing.
create function public.prevent_related_business_reassignment()
returns trigger language plpgsql security invoker set search_path = pg_catalog
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'related records cannot be reassigned to another business';
  end if;
  return new;
end;
$$;

create function public.prevent_published_category_deactivation()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if old.active and not new.active and exists (
    select 1 from public.businesses where primary_category_id = new.id and publication_status = 'published'
  ) then
    raise exception 'cannot deactivate a category used by a published business';
  end if;
  return new;
end;
$$;

create trigger businesses_keep_published_valid
after update on public.businesses for each row execute function public.enforce_published_business_integrity();
create trigger service_areas_keep_published_valid
after insert or update or delete on public.business_service_areas for each row execute function public.enforce_published_business_integrity();
create trigger service_areas_prevent_reassignment
before update of business_id on public.business_service_areas for each row execute function public.prevent_related_business_reassignment();
create trigger services_prevent_reassignment
before update of business_id on public.business_services for each row execute function public.prevent_related_business_reassignment();
create trigger hours_prevent_reassignment
before update of business_id on public.business_hours for each row execute function public.prevent_related_business_reassignment();
create trigger media_prevent_reassignment
before update of business_id on public.business_media for each row execute function public.prevent_related_business_reassignment();
create trigger categories_prevent_published_deactivation
before update of active on public.categories for each row execute function public.prevent_published_category_deactivation();

create function public.create_business_for_current_user(
  p_canonical_name text, p_primary_phone text, p_primary_category_id uuid, p_location_mode public.location_mode,
  p_city text, p_state text, p_country text, p_country_code char(2) default 'IN',
  p_address_line_1 text default null, p_address_line_2 text default null, p_locality text default null,
  p_postal_code text default null, p_show_street_address boolean default false,
  p_latitude numeric default null, p_longitude numeric default null
) returns uuid language plpgsql security definer set search_path = pg_catalog
as $$
declare new_business_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from public.categories where id = p_primary_category_id and active) then raise exception 'primary category must be active'; end if;
  if (p_latitude is null) <> (p_longitude is null) or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'a valid latitude and longitude pair is required when a map point is supplied'; end if;
  insert into public.businesses (canonical_name, slug, primary_phone, primary_phone_normalized, primary_category_id, location_mode, city, state, country, country_code, address_line_1, address_line_2, locality, postal_code, show_street_address, geo_point, created_by)
  values (p_canonical_name, 'pending-derived-slug', p_primary_phone, '0000000', p_primary_category_id, p_location_mode, p_city, p_state, p_country, upper(p_country_code), p_address_line_1, p_address_line_2, p_locality, p_postal_code, p_show_street_address, case when p_latitude is null then null else extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography end, auth.uid())
  returning id into new_business_id;
  insert into public.business_managers (business_id, user_id, role) values (new_business_id, auth.uid(), 'owner');
  return new_business_id;
end;
$$;

create function public.transition_business_publication(target_business_id uuid, next_status public.publication_status)
returns void language plpgsql security definer set search_path = pg_catalog
as $$
declare current_status public.publication_status;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select publication_status into current_status from public.businesses where id = target_business_id for update;
  if not found then raise exception 'business not found'; end if;
  if public.is_admin() then null;
  elsif public.is_business_manager(target_business_id) and current_status = 'draft' and next_status = 'pending' then null;
  else raise exception 'not authorized for this publication transition'; end if;
  if next_status in ('pending', 'published') then perform public.assert_business_publishable(target_business_id); end if;
  update public.businesses set publication_status = next_status where id = target_business_id;
end;
$$;

create function public.set_business_verification(target_business_id uuid, next_status public.verification_status)
returns void language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if not public.is_admin() then raise exception 'admin role required'; end if;
  update public.businesses set verification_status = next_status where id = target_business_id;
  if not found then raise exception 'business not found'; end if;
end;
$$;

-- This is the only anonymous business reader. It contains no IDs, normalized
-- fields, private coordinates, internal lifecycle/audit values, or hidden email.
create function public.get_published_business_public(requested_slug text)
returns table (slug text, canonical_name text, description text, primary_phone text, alternate_phone text, whatsapp_phone text, business_contact_email text, website_url text, category_name text, category_slug text, location_mode public.location_mode, address_line_1 text, address_line_2 text, locality text, city text, district text, state text, country text, postal_code text, facebook_url text, instagram_url text, linkedin_url text, youtube_url text)
language sql stable security definer set search_path = pg_catalog
as $$
  select business.slug, business.canonical_name, business.description, business.primary_phone, business.alternate_phone, business.whatsapp_phone,
    case when business.show_email then business.business_contact_email else null end, business.website_url, category.name, category.slug, business.location_mode,
    case when business.show_street_address then business.address_line_1 else null end, case when business.show_street_address then business.address_line_2 else null end,
    case when business.show_street_address then business.locality else null end, business.city, case when business.show_street_address then business.district else null end,
    business.state, business.country, case when business.show_street_address then business.postal_code else null end,
    business.facebook_url, business.instagram_url, business.linkedin_url, business.youtube_url
  from public.businesses business join public.categories category on category.id = business.primary_category_id and category.active
  where business.publication_status = 'published' and business.slug = requested_slug;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_managers enable row level security;
alter table public.business_services enable row level security;
alter table public.business_service_areas enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_media enable row level security;
alter table public.slug_history enable row level security;

create policy profiles_select_self_or_admin on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());
create policy profiles_update_self_or_admin on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy categories_select_active_or_admin on public.categories for select using (active or public.is_admin());
create policy categories_admin_manage on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy businesses_select_manager_or_admin on public.businesses for select using (public.is_business_manager(id) or public.is_admin());
create policy businesses_update_manager_or_admin on public.businesses for update using (public.is_business_manager(id) or public.is_admin()) with check (public.is_business_manager(id) or public.is_admin());
create policy businesses_admin_delete on public.businesses for delete using (public.is_admin());
create policy managers_select_self_or_admin on public.business_managers for select using (user_id = auth.uid() or public.is_admin());
create policy managers_admin_manage on public.business_managers for all using (public.is_admin()) with check (public.is_admin());
create policy services_manager_or_admin on public.business_services for all using (public.is_business_manager(business_id) or public.is_admin()) with check (public.is_business_manager(business_id) or public.is_admin());
create policy service_areas_manager_or_admin on public.business_service_areas for all using (public.is_business_manager(business_id) or public.is_admin()) with check (public.is_business_manager(business_id) or public.is_admin());
create policy hours_manager_or_admin on public.business_hours for all using (public.is_business_manager(business_id) or public.is_admin()) with check (public.is_business_manager(business_id) or public.is_admin());
create policy media_manager_or_admin on public.business_media for all using (public.is_business_manager(business_id) or public.is_admin()) with check (public.is_business_manager(business_id) or public.is_admin());
create policy slug_history_admin_only on public.slug_history for select using (public.is_admin());

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select, insert, update (full_name) on public.profiles to authenticated;
grant select, update (canonical_name, description, year_established, primary_phone, alternate_phone, whatsapp_phone, business_contact_email, show_email, website_url, primary_category_id, location_mode, address_line_1, address_line_2, locality, city, district, state, country, country_code, postal_code, show_street_address, geo_point, facebook_url, instagram_url, linkedin_url, youtube_url) on public.businesses to authenticated;
grant delete on public.businesses to authenticated;
grant select, insert, update, delete on public.business_managers, public.business_services, public.business_service_areas, public.business_hours, public.business_media to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_business_manager(uuid) to authenticated;
grant execute on function public.get_published_business_public(text) to anon, authenticated;
grant execute on function public.create_business_for_current_user(text, text, uuid, public.location_mode, text, text, text, char(2), text, text, text, text, boolean, numeric, numeric) to authenticated;
grant execute on function public.transition_business_publication(uuid, public.publication_status) to authenticated;
grant execute on function public.set_business_verification(uuid, public.verification_status) to authenticated;

insert into public.categories (id, name, slug, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Digital Marketing Agency', 'digital-marketing-agency', 10),
  ('10000000-0000-0000-0000-000000000002', 'Web Design Company', 'web-design-company', 20),
  ('10000000-0000-0000-0000-000000000003', 'Restaurant', 'restaurant', 30),
  ('10000000-0000-0000-0000-000000000004', 'Hotel', 'hotel', 40),
  ('10000000-0000-0000-0000-000000000005', 'Travel Agency', 'travel-agency', 50),
  ('10000000-0000-0000-0000-000000000006', 'Real Estate Agency', 'real-estate-agency', 60),
  ('10000000-0000-0000-0000-000000000007', 'Financial Consultant', 'financial-consultant', 70),
  ('10000000-0000-0000-0000-000000000008', 'Clinic', 'clinic', 80),
  ('10000000-0000-0000-0000-000000000009', 'Beauty Salon', 'beauty-salon', 90),
  ('10000000-0000-0000-0000-000000000010', 'Automobile Service', 'automobile-service', 100),
  ('10000000-0000-0000-0000-000000000011', 'Education & Training', 'education-training', 110),
  ('10000000-0000-0000-0000-000000000012', 'Retail Store', 'retail-store', 120)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;
