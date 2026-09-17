-- Migration: 20260917190000_business_profile_expansion.sql
-- Description: Business profile expansion following Boss review:
-- 1. Services: service_description column + max 20 services per business DB enforcement
-- 2. Products: public.business_products table + max 20 products per business DB enforcement
-- 3. Gallery & Media: business_media expanded with 'gallery' kind, sort_order, caption, singleton index for logo/cover
-- 4. Google Business Profile URL: google_business_profile_url on public.businesses
-- 5. Storage: 'business-media' bucket setup + RLS policies
-- 6. Updated public projection: get_published_business_by_slug

-- ============================================================================
-- 1. SERVICES EXPANSION
-- ============================================================================

alter table public.business_services
  add column if not exists service_description text check (service_description is null or char_length(service_description) <= 1000);

create or replace function public.enforce_business_services_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if (select count(*) from public.business_services where business_id = new.business_id) >= 20 then
    raise exception 'A business cannot have more than 20 services';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_business_services_limit on public.business_services;
create trigger trg_enforce_business_services_limit
before insert on public.business_services
for each row execute function public.enforce_business_services_limit();

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================

create table if not exists public.business_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  image_path text check (image_path is null or char_length(image_path) <= 500),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_products_business_idx on public.business_products (business_id);

drop trigger if exists business_products_set_updated_at on public.business_products;
create trigger business_products_set_updated_at
before update on public.business_products
for each row execute function public.set_updated_at();

drop trigger if exists trg_prevent_product_business_reassignment on public.business_products;
create trigger trg_prevent_product_business_reassignment
before update of business_id on public.business_products
for each row execute function public.prevent_related_business_reassignment();

create or replace function public.enforce_business_products_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if (select count(*) from public.business_products where business_id = new.business_id) >= 20 then
    raise exception 'A business cannot have more than 20 products';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_business_products_limit on public.business_products;
create trigger trg_enforce_business_products_limit
before insert on public.business_products
for each row execute function public.enforce_business_products_limit();

alter table public.business_products enable row level security;

drop policy if exists products_manager_or_admin on public.business_products;
create policy products_manager_or_admin on public.business_products for all
using (public.is_business_manager(business_id) or public.is_admin())
with check (public.is_business_manager(business_id) or public.is_admin());

grant select, insert, update, delete on public.business_products to authenticated;

-- ============================================================================
-- 3. GALLERY & MEDIA ARCHITECTURE
-- ============================================================================

alter table public.business_media drop constraint if exists business_media_kind_check;
alter table public.business_media add constraint business_media_kind_check check (kind in ('logo', 'cover', 'gallery'));

alter table public.business_media add column if not exists sort_order smallint not null default 0;
alter table public.business_media add column if not exists caption text check (caption is null or char_length(caption) <= 200);

alter table public.business_media drop constraint if exists business_media_business_id_kind_key;
drop index if exists public.business_media_singleton_kind_idx;
create unique index business_media_singleton_kind_idx
on public.business_media (business_id, kind)
where kind in ('logo', 'cover');

create index if not exists business_media_business_kind_idx on public.business_media (business_id, kind, sort_order);

-- ============================================================================
-- 4. GOOGLE BUSINESS PROFILE URL
-- ============================================================================

alter table public.businesses
  add column if not exists google_business_profile_url text
  check (google_business_profile_url is null or google_business_profile_url ~* '^https?://');

grant update (google_business_profile_url) on public.businesses to authenticated;

-- ============================================================================
-- 5. STORAGE BUCKET & POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

drop policy if exists "Public read business media" on storage.objects;
create policy "Public read business media"
on storage.objects for select
using (bucket_id = 'business-media');

drop policy if exists "Authenticated managers can upload business media" on storage.objects;
create policy "Authenticated managers can upload business media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'business-media'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1]::uuid in (
        select bm.business_id from public.business_managers bm where bm.user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "Authenticated managers can delete business media" on storage.objects;
create policy "Authenticated managers can delete business media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'business-media'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1]::uuid in (
        select bm.business_id from public.business_managers bm where bm.user_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- 6. UPDATED PUBLIC PROJECTION FUNCTION
-- ============================================================================

create or replace function public.get_published_business_by_slug(p_slug text)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
begin
  if p_slug is null or char_length(p_slug) > 160 then
    return null;
  end if;

  select jsonb_build_object(
    'slug', b.slug,
    'canonical_name', b.canonical_name,
    'description', b.description,
    'primary_phone', b.primary_phone,
    'alternate_phone', b.alternate_phone,
    'whatsapp_phone', b.whatsapp_phone,
    'business_contact_email', case when b.show_email then b.business_contact_email else null end,
    'show_email', b.show_email,
    'website_url', b.website_url,
    'google_business_profile_url', b.google_business_profile_url,
    'category_name', c.name,
    'category_slug', c.slug,
    'location_mode', b.location_mode,
    'address_line_1', case when b.location_mode <> 'service_area' and b.show_street_address then b.address_line_1 else null end,
    'address_line_2', case when b.location_mode <> 'service_area' and b.show_street_address then b.address_line_2 else null end,
    'locality', case when b.location_mode <> 'service_area' and b.show_street_address then b.locality else null end,
    'city', b.city,
    'district', case when b.location_mode <> 'service_area' and b.show_street_address then b.district else null end,
    'state', b.state,
    'country', b.country,
    'country_code', b.country_code,
    'postal_code', case when b.location_mode <> 'service_area' and b.show_street_address then b.postal_code else null end,
    'show_street_address', case when b.location_mode = 'service_area' then false else b.show_street_address end,
    'facebook_url', b.facebook_url,
    'instagram_url', b.instagram_url,
    'linkedin_url', b.linkedin_url,
    'youtube_url', b.youtube_url,
    'verification_status', b.verification_status,
    'created_at', b.created_at,
    'updated_at', b.updated_at,
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'service_name', s.service_name,
          'service_description', s.service_description
        )
        order by s.sort_order, s.service_name
      )
      from public.business_services s
      where s.business_id = b.id
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'image_path', p.image_path,
          'sort_order', p.sort_order
        )
        order by p.sort_order, p.name
      )
      from public.business_products p
      where p.business_id = b.id
    ), '[]'::jsonb),
    'service_areas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', sa.name,
          'city', sa.city,
          'state', sa.state,
          'country', sa.country
        )
        order by sa.name
      )
      from public.business_service_areas sa
      where sa.business_id = b.id
    ), '[]'::jsonb),
    'hours', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'day_of_week', h.day_of_week,
          'opens_at', h.opens_at,
          'closes_at', h.closes_at,
          'is_closed', h.is_closed,
          'is_24_hours', h.is_24_hours
        )
        order by h.day_of_week
      )
      from public.business_hours h
      where h.business_id = b.id
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'kind', m.kind,
          'storage_path', m.storage_path,
          'sort_order', m.sort_order,
          'caption', m.caption
        )
        order by m.sort_order, m.created_at
      )
      from public.business_media m
      where m.business_id = b.id
    ), '[]'::jsonb)
  ) into v_result
  from public.businesses b
  join public.categories c on c.id = b.primary_category_id and c.active
  where b.slug = lower(btrim(p_slug))
    and b.publication_status = 'published';

  return v_result;
end;
$$;

revoke all on function public.get_published_business_by_slug(text) from public, anon, authenticated;
grant execute on function public.get_published_business_by_slug(text) to anon, authenticated;
