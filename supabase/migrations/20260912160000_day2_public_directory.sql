-- Day 2 — Public Directory, Search, Discovery, SEO & Staging Readiness
-- Hardened Security Definer RPCs and indexes for public access.

create extension if not exists pg_trgm;

-- 1. Search and Discovery Indexes
create index if not exists businesses_name_trgm_idx on public.businesses using gin (canonical_name gin_trgm_ops);
create index if not exists businesses_city_trgm_idx on public.businesses using gin (city gin_trgm_ops);
create index if not exists categories_name_trgm_idx on public.categories using gin (name gin_trgm_ops);
create index if not exists services_name_trgm_idx on public.business_services using gin (service_name gin_trgm_ops);
create index if not exists service_areas_name_trgm_idx on public.business_service_areas using gin (name gin_trgm_ops);
create index if not exists businesses_published_date_idx on public.businesses (updated_at desc) where publication_status = 'published';

-- 2. Approved Combination Indexes Table (Constraint 2: No accidental indexation of arbitrary combinations)
create table if not exists public.approved_combination_indexes (
  id uuid primary key default gen_random_uuid(),
  location_slug text not null check (location_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category_slug text not null check (category_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_indexable boolean not null default true,
  created_at timestamptz not null default now(),
  unique (location_slug, category_slug)
);

alter table public.approved_combination_indexes enable row level security;

create policy approved_combinations_select on public.approved_combination_indexes
  for select using (true);

create policy approved_combinations_admin on public.approved_combination_indexes
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.approved_combination_indexes to anon, authenticated;
grant insert, update, delete on public.approved_combination_indexes to authenticated;

-- Seed approved indexable combinations
insert into public.approved_combination_indexes (location_slug, category_slug, is_indexable)
values
  ('chennai', 'retail-store', true),
  ('bengaluru', 'digital-marketing-agency', true),
  ('delhi', 'automobile-service', true)
on conflict (location_slug, category_slug) do nothing;


-- 3. Resolve Old/Changed Business Slugs (Permanent 301 Redirect Target)
create or replace function public.resolve_business_slug_redirect(p_slug text)
returns text
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_canonical_slug text;
begin
  if p_slug is null or char_length(p_slug) > 160 then
    return null;
  end if;

  select b.slug into v_canonical_slug
  from public.slug_history sh
  join public.businesses b on b.id = sh.business_id
  join public.categories c on c.id = b.primary_category_id and c.active
  where sh.slug = lower(btrim(p_slug))
    and b.publication_status = 'published'
  order by sh.created_at desc
  limit 1;

  return v_canonical_slug;
end;
$$;

revoke all on function public.resolve_business_slug_redirect(text) from public, anon, authenticated;
grant execute on function public.resolve_business_slug_redirect(text) to anon, authenticated;


-- 4. Get Published Business by Slug (Zero-leak public detail projection)
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
        jsonb_build_object('service_name', s.service_name)
        order by s.sort_order, s.service_name
      )
      from public.business_services s
      where s.business_id = b.id
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
          'kind', m.kind,
          'storage_path', m.storage_path
        )
        order by m.kind
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


-- 5. Search Published Businesses (Bounded, Sanitized, Published-Only)
create or replace function public.search_published_businesses(
  p_query text default null,
  p_category_slug text default null,
  p_location_slug text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_query text;
  v_category_slug text;
  v_location_slug text;
  v_limit int;
  v_offset int;
  v_total_count bigint := 0;
  v_items jsonb := '[]'::jsonb;
begin
  -- Enforce safe bounding constraints
  v_query := left(btrim(coalesce(p_query, '')), 100);
  v_category_slug := left(lower(btrim(coalesce(p_category_slug, ''))), 100);
  if v_category_slug = '' then v_category_slug := null; end if;

  v_location_slug := left(lower(btrim(coalesce(p_location_slug, ''))), 100);
  if v_location_slug = '' then v_location_slug := null; end if;

  v_limit := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset := greatest(coalesce(p_offset, 0), 0);

  -- Count total matches
  select count(distinct b.id) into v_total_count
  from public.businesses b
  join public.categories c on c.id = b.primary_category_id and c.active
  where b.publication_status = 'published'
    and (v_category_slug is null or c.slug = v_category_slug)
    and (v_location_slug is null or (
      public.slug_base(b.city) = v_location_slug or
      exists (
        select 1 from public.business_service_areas sa
        where sa.business_id = b.id
          and (public.slug_base(sa.name) = v_location_slug or public.slug_base(coalesce(sa.city, '')) = v_location_slug)
      )
    ))
    and (v_query = '' or (
      b.canonical_name ilike ('%' || v_query || '%') or
      b.city ilike ('%' || v_query || '%') or
      c.name ilike ('%' || v_query || '%') or
      b.description ilike ('%' || v_query || '%') or
      exists (
        select 1 from public.business_services s
        where s.business_id = b.id and s.service_name ilike ('%' || v_query || '%')
      ) or
      exists (
        select 1 from public.business_service_areas sa
        where sa.business_id = b.id and (sa.name ilike ('%' || v_query || '%') or coalesce(sa.city, '') ilike ('%' || v_query || '%'))
      ) or
      similarity(b.canonical_name, v_query) > 0.2
    ));

  -- Retrieve paged results
  with matching_businesses as (
    select b.id, b.slug, b.canonical_name, b.description, b.location_mode,
           b.city, b.state, b.country, b.country_code, b.primary_phone, b.whatsapp_phone,
           b.website_url, b.show_street_address,
           case when b.location_mode <> 'service_area' and b.show_street_address then b.address_line_1 else null end as address_line_1,
           case when b.location_mode <> 'service_area' and b.show_street_address then b.locality else null end as locality,
           case when b.location_mode <> 'service_area' and b.show_street_address then b.postal_code else null end as postal_code,
           b.verification_status, b.updated_at,
           c.name as category_name, c.slug as category_slug,
           case
             when v_query = '' then 0
             else (similarity(b.canonical_name, v_query) * 2 + case when b.canonical_name ilike ('%' || v_query || '%') then 1 else 0 end)
           end as relevance_score
    from public.businesses b
    join public.categories c on c.id = b.primary_category_id and c.active
    where b.publication_status = 'published'
      and (v_category_slug is null or c.slug = v_category_slug)
      and (v_location_slug is null or (
        public.slug_base(b.city) = v_location_slug or
        exists (
          select 1 from public.business_service_areas sa
          where sa.business_id = b.id
            and (public.slug_base(sa.name) = v_location_slug or public.slug_base(coalesce(sa.city, '')) = v_location_slug)
        )
      ))
      and (v_query = '' or (
        b.canonical_name ilike ('%' || v_query || '%') or
        b.city ilike ('%' || v_query || '%') or
        c.name ilike ('%' || v_query || '%') or
        b.description ilike ('%' || v_query || '%') or
        exists (
          select 1 from public.business_services s
          where s.business_id = b.id and s.service_name ilike ('%' || v_query || '%')
        ) or
        exists (
          select 1 from public.business_service_areas sa
          where sa.business_id = b.id and (sa.name ilike ('%' || v_query || '%') or coalesce(sa.city, '') ilike ('%' || v_query || '%'))
        ) or
        similarity(b.canonical_name, v_query) > 0.2
      ))
    order by relevance_score desc, b.updated_at desc
    limit v_limit
    offset v_offset
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'slug', mb.slug,
      'canonical_name', mb.canonical_name,
      'description', mb.description,
      'category_name', mb.category_name,
      'category_slug', mb.category_slug,
      'location_mode', mb.location_mode,
      'city', mb.city,
      'state', mb.state,
      'country', mb.country,
      'country_code', mb.country_code,
      'primary_phone', mb.primary_phone,
      'whatsapp_phone', mb.whatsapp_phone,
      'website_url', mb.website_url,
      'show_street_address', case when mb.location_mode = 'service_area' then false else mb.show_street_address end,
      'address_line_1', mb.address_line_1,
      'locality', mb.locality,
      'postal_code', mb.postal_code,
      'verification_status', mb.verification_status,
      'updated_at', mb.updated_at,
      'services', coalesce((
        select jsonb_agg(s.service_name order by s.sort_order, s.service_name)
        from public.business_services s
        where s.business_id = mb.id
      ), '[]'::jsonb),
      'service_areas', coalesce((
        select jsonb_agg(sa.name order by sa.name)
        from public.business_service_areas sa
        where sa.business_id = mb.id
      ), '[]'::jsonb)
    )
  ), '[]'::jsonb) into v_items
  from matching_businesses mb;

  return jsonb_build_object(
    'total_count', v_total_count,
    'limit', v_limit,
    'offset', v_offset,
    'items', v_items
  );
end;
$$;

revoke all on function public.search_published_businesses(text, text, text, int, int) from public, anon, authenticated;
grant execute on function public.search_published_businesses(text, text, text, int, int) to anon, authenticated;


-- 6. Category Discovery RPC
create or replace function public.get_published_businesses_by_category(
  p_category_slug text,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_category record;
  v_search_result jsonb;
begin
  if p_category_slug is null then
    return null;
  end if;

  select id, name, slug into v_category
  from public.categories
  where slug = lower(btrim(p_category_slug)) and active;

  if not found then
    return null;
  end if;

  v_search_result := public.search_published_businesses(
    p_query => null,
    p_category_slug => v_category.slug,
    p_location_slug => null,
    p_limit => p_limit,
    p_offset => p_offset
  );

  return jsonb_build_object(
    'category', jsonb_build_object(
      'name', v_category.name,
      'slug', v_category.slug
    ),
    'total_count', (v_search_result ->> 'total_count')::int,
    'limit', (v_search_result ->> 'limit')::int,
    'offset', (v_search_result ->> 'offset')::int,
    'items', v_search_result -> 'items'
  );
end;
$$;

revoke all on function public.get_published_businesses_by_category(text, int, int) from public, anon, authenticated;
grant execute on function public.get_published_businesses_by_category(text, int, int) to anon, authenticated;


-- 7. Location Discovery RPC
create or replace function public.get_published_businesses_by_location(
  p_location_slug text,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_display_name text;
  v_search_result jsonb;
begin
  if p_location_slug is null then
    return null;
  end if;

  -- Resolve display city name from actual businesses or service areas
  select b.city into v_display_name
  from public.businesses b
  join public.categories c on c.id = b.primary_category_id and c.active
  where b.publication_status = 'published'
    and public.slug_base(b.city) = lower(btrim(p_location_slug))
  limit 1;

  if v_display_name is null then
    select sa.name into v_display_name
    from public.business_service_areas sa
    join public.businesses b on b.id = sa.business_id
    join public.categories c on c.id = b.primary_category_id and c.active
    where b.publication_status = 'published'
      and (public.slug_base(sa.name) = lower(btrim(p_location_slug)) or public.slug_base(coalesce(sa.city, '')) = lower(btrim(p_location_slug)))
    limit 1;
  end if;

  if v_display_name is null then
    return null;
  end if;

  v_search_result := public.search_published_businesses(
    p_query => null,
    p_category_slug => null,
    p_location_slug => lower(btrim(p_location_slug)),
    p_limit => p_limit,
    p_offset => p_offset
  );

  return jsonb_build_object(
    'location', jsonb_build_object(
      'name', v_display_name,
      'slug', lower(btrim(p_location_slug))
    ),
    'total_count', (v_search_result ->> 'total_count')::int,
    'limit', (v_search_result ->> 'limit')::int,
    'offset', (v_search_result ->> 'offset')::int,
    'items', v_search_result -> 'items'
  );
end;
$$;

revoke all on function public.get_published_businesses_by_location(text, int, int) from public, anon, authenticated;
grant execute on function public.get_published_businesses_by_location(text, int, int) to anon, authenticated;


-- 8. Combination Discovery RPC (Location + Category) with indexable check
create or replace function public.get_published_businesses_by_location_and_category(
  p_location_slug text,
  p_category_slug text,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_category record;
  v_display_location text;
  v_is_indexable boolean := false;
  v_search_result jsonb;
begin
  if p_location_slug is null or p_category_slug is null then
    return null;
  end if;

  select id, name, slug into v_category
  from public.categories
  where slug = lower(btrim(p_category_slug)) and active;

  if not found then
    return null;
  end if;

  select b.city into v_display_location
  from public.businesses b
  where b.publication_status = 'published'
    and public.slug_base(b.city) = lower(btrim(p_location_slug))
  limit 1;

  if v_display_location is null then
    select sa.name into v_display_location
    from public.business_service_areas sa
    join public.businesses b on b.id = sa.business_id
    where b.publication_status = 'published'
      and (public.slug_base(sa.name) = lower(btrim(p_location_slug)) or public.slug_base(coalesce(sa.city, '')) = lower(btrim(p_location_slug)))
    limit 1;
  end if;

  if v_display_location is null then
    return null;
  end if;

  -- Check whether this combination is officially approved for indexation (Constraint 2)
  select coalesce(is_indexable, false) into v_is_indexable
  from public.approved_combination_indexes
  where location_slug = lower(btrim(p_location_slug))
    and category_slug = v_category.slug;

  if v_is_indexable is null then
    v_is_indexable := false;
  end if;

  v_search_result := public.search_published_businesses(
    p_query => null,
    p_category_slug => v_category.slug,
    p_location_slug => lower(btrim(p_location_slug)),
    p_limit => p_limit,
    p_offset => p_offset
  );

  return jsonb_build_object(
    'location', jsonb_build_object(
      'name', v_display_location,
      'slug', lower(btrim(p_location_slug))
    ),
    'category', jsonb_build_object(
      'name', v_category.name,
      'slug', v_category.slug
    ),
    'is_indexable', v_is_indexable,
    'total_count', (v_search_result ->> 'total_count')::int,
    'limit', (v_search_result ->> 'limit')::int,
    'offset', (v_search_result ->> 'offset')::int,
    'items', v_search_result -> 'items'
  );
end;
$$;

revoke all on function public.get_published_businesses_by_location_and_category(text, text, int, int) from public, anon, authenticated;
grant execute on function public.get_published_businesses_by_location_and_category(text, text, int, int) to anon, authenticated;


-- 9. Directory Homepage Aggregated Data (Constraint 5: "Recently Published Businesses")
create or replace function public.get_directory_home_data()
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_categories jsonb;
  v_locations jsonb;
  v_recent jsonb;
  v_total_businesses bigint;
  v_total_categories bigint;
  v_total_locations bigint;
begin
  -- Categories with published counts
  with cat_counts as (
    select c.id, c.name, c.slug, c.sort_order, count(b.id) as published_count
    from public.categories c
    left join public.businesses b on b.primary_category_id = c.id and b.publication_status = 'published'
    where c.active
    group by c.id, c.name, c.slug, c.sort_order
    order by count(b.id) desc, c.sort_order, c.name
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', cc.name,
    'slug', cc.slug,
    'count', cc.published_count
  )), '[]'::jsonb) into v_categories
  from cat_counts cc;

  -- Top locations with published counts
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', loc.city_name,
    'slug', public.slug_base(loc.city_name),
    'count', loc.biz_count
  )), '[]'::jsonb) into v_locations
  from (
    select b.city as city_name, count(*) as biz_count
    from public.businesses b
    join public.categories c on c.id = b.primary_category_id and c.active
    where b.publication_status = 'published'
    group by b.city
    order by count(*) desc, b.city
    limit 12
  ) loc;

  -- Recently Published Businesses (up to 6 listings)
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', b.slug,
    'canonical_name', b.canonical_name,
    'description', b.description,
    'category_name', b.category_name,
    'category_slug', b.category_slug,
    'location_mode', b.location_mode,
    'city', b.city,
    'state', b.state,
    'country', b.country,
    'country_code', b.country_code,
    'primary_phone', b.primary_phone,
    'whatsapp_phone', b.whatsapp_phone,
    'website_url', b.website_url,
    'show_street_address', case when b.location_mode = 'service_area' then false else b.show_street_address end,
    'address_line_1', case when b.location_mode <> 'service_area' and b.show_street_address then b.address_line_1 else null end,
    'locality', case when b.location_mode <> 'service_area' and b.show_street_address then b.locality else null end,
    'postal_code', case when b.location_mode <> 'service_area' and b.show_street_address then b.postal_code else null end,
    'verification_status', b.verification_status,
    'updated_at', b.updated_at,
    'services', coalesce((
      select jsonb_agg(s.service_name order by s.sort_order, s.service_name)
      from public.business_services s
      where s.business_id = b.id
    ), '[]'::jsonb),
    'service_areas', coalesce((
      select jsonb_agg(sa.name order by sa.name)
      from public.business_service_areas sa
      where sa.business_id = b.id
    ), '[]'::jsonb)
  )), '[]'::jsonb) into v_recent
  from (
    select b.*, c.name as category_name, c.slug as category_slug
    from public.businesses b
    join public.categories c on c.id = b.primary_category_id and c.active
    where b.publication_status = 'published'
    order by b.updated_at desc
    limit 6
  ) b;

  -- Stats
  select count(*) into v_total_businesses from public.businesses where publication_status = 'published';
  select count(*) into v_total_categories from public.categories where active;
  select count(distinct city) into v_total_locations from public.businesses where publication_status = 'published';

  return jsonb_build_object(
    'categories', v_categories,
    'locations', v_locations,
    'recent_businesses', v_recent,
    'stats', jsonb_build_object(
      'total_businesses', v_total_businesses,
      'total_categories', v_total_categories,
      'total_locations', v_total_locations
    )
  );
end;
$$;

revoke all on function public.get_directory_home_data() from public, anon, authenticated;
grant execute on function public.get_directory_home_data() to anon, authenticated;


-- 10. Fast Sitemap Entries RPC
create or replace function public.get_sitemap_entries()
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_businesses jsonb;
  v_categories jsonb;
  v_locations jsonb;
  v_combinations jsonb;
begin
  -- Published businesses
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', b.slug,
    'updated_at', b.updated_at
  ) order by b.updated_at desc), '[]'::jsonb) into v_businesses
  from public.businesses b
  join public.categories c on c.id = b.primary_category_id and c.active
  where b.publication_status = 'published';

  -- Active categories
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', c.slug
  ) order by c.sort_order, c.name), '[]'::jsonb) into v_categories
  from public.categories c
  where c.active;

  -- Locations with at least one published business
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', public.slug_base(b.city)
  ) order by b.city), '[]'::jsonb) into v_locations
  from (
    select distinct city
    from public.businesses
    where publication_status = 'published'
  ) b;

  -- Approved indexable combinations only (Constraint 2)
  select coalesce(jsonb_agg(jsonb_build_object(
    'location_slug', ac.location_slug,
    'category_slug', ac.category_slug
  ) order by ac.location_slug, ac.category_slug), '[]'::jsonb) into v_combinations
  from public.approved_combination_indexes ac
  where ac.is_indexable;

  return jsonb_build_object(
    'businesses', v_businesses,
    'categories', v_categories,
    'locations', v_locations,
    'combinations', v_combinations
  );
end;
$$;

revoke all on function public.get_sitemap_entries() from public, anon, authenticated;
grant execute on function public.get_sitemap_entries() to anon, authenticated;
