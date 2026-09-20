begin;
select plan(12);

-- 1. Verify place_id column exists on public.businesses
select has_column('public', 'businesses', 'place_id', 'businesses has place_id column');

-- 2. Verify column type is text
select col_type_is('public', 'businesses', 'place_id', 'text', 'businesses.place_id is text');

-- 3. Verify partial index on place_id exists
select has_index('public', 'businesses', 'businesses_place_id_idx', 'businesses has partial index on place_id');

-- Setup test users
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('33333333-3333-3333-3333-333333333331', 'authenticated', 'authenticated', 'places_owner_a@test.buzl', '{"provider":"email","providers":["email"],"role":"business_owner","status":"active"}', '{}', now(), now()),
  ('33333333-3333-3333-3333-333333333332', 'authenticated', 'authenticated', 'places_owner_b@test.buzl', '{"provider":"email","providers":["email"],"role":"business_owner","status":"active"}', '{}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'places_admin@test.buzl', '{"provider":"email","providers":["email"],"role":"admin","status":"active"}', '{}', now(), now())
on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data;

-- 4. Create business with place_id using create_business_for_current_user as Owner A
set local role authenticated;
select set_config('request.jwt.claims', json_build_object(
  'sub', '33333333-3333-3333-3333-333333333331',
  'email', 'places_owner_a@test.buzl',
  'role', 'authenticated',
  'app_metadata', json_build_object('role', 'business_owner', 'status', 'active')
)::text, true);

do $$
declare
  v_bid uuid;
begin
  v_bid := public.create_business_for_current_user(
    'Places Test Store A',
    '+91 98888 77771',
    '10000000-0000-0000-0000-000000000001',
    'storefront',
    'Bengaluru',
    'Karnataka',
    'India',
    'IN',
    '123 MG Road',
    null,
    'Central',
    '560001',
    true,
    12.9716,
    77.5946,
    'ChIJbU60yXAWrjsR4E9-UejW3_g'
  );
end;
$$;

select is(
  (select place_id from public.businesses where canonical_name = 'Places Test Store A'),
  'ChIJbU60yXAWrjsR4E9-UejW3_g',
  'create_business_for_current_user correctly persists place_id'
);

-- 5. Owner A can update place_id on owned business
update public.businesses
set place_id = 'ChIJ_updated_place_id_12345'
where canonical_name = 'Places Test Store A';

select is(
  (select place_id from public.businesses where canonical_name = 'Places Test Store A'),
  'ChIJ_updated_place_id_12345',
  'Owner A can update place_id on owned business'
);

-- 6. Owner B attempts to update place_id on Owner A business (RLS Owner Isolation)
select set_config('request.jwt.claims', json_build_object(
  'sub', '33333333-3333-3333-3333-333333333332',
  'email', 'places_owner_b@test.buzl',
  'role', 'authenticated',
  'app_metadata', json_build_object('role', 'business_owner', 'status', 'active')
)::text, true);

update public.businesses
set place_id = 'ChIJ_hacked_place_id'
where canonical_name = 'Places Test Store A';

-- Switch back to Owner A to verify place_id was NOT modified
select set_config('request.jwt.claims', json_build_object(
  'sub', '33333333-3333-3333-3333-333333333331',
  'email', 'places_owner_a@test.buzl',
  'role', 'authenticated',
  'app_metadata', json_build_object('role', 'business_owner', 'status', 'active')
)::text, true);

select is(
  (select place_id from public.businesses where canonical_name = 'Places Test Store A'),
  'ChIJ_updated_place_id_12345',
  'Owner B cannot update place_id on Owner A business (RLS isolated)'
);

-- 7. Legacy listing without place_id is valid and editable
do $$
declare
  v_bid uuid;
begin
  v_bid := public.create_business_for_current_user(
    'Legacy Store Without Place ID',
    '+91 98888 77772',
    '10000000-0000-0000-0000-000000000001',
    'storefront',
    'Chennai',
    'Tamil Nadu',
    'India',
    'IN',
    '45 Anna Salai',
    null,
    'Mount Road',
    '600002',
    true,
    13.0827,
    80.2707,
    null -- no place_id
  );
end;
$$;

select is(
  (select place_id from public.businesses where canonical_name = 'Legacy Store Without Place ID'),
  null,
  'Legacy business creation without place_id succeeds with null place_id'
);

-- Update legacy listing without providing place_id
update public.businesses
set description = 'Updated legacy description without touching place_id'
where canonical_name = 'Legacy Store Without Place ID';

select is(
  (select description from public.businesses where canonical_name = 'Legacy Store Without Place ID'),
  'Updated legacy description without touching place_id',
  'Legacy business remains editable without place_id'
);

-- 8. Constraint check: place_id cannot exceed 255 chars or be empty whitespace
select throws_ok(
  $$
    update public.businesses
    set place_id = repeat('x', 256)
    where canonical_name = 'Places Test Store A'
  $$,
  null,
  'Cannot insert place_id longer than 255 characters'
);

-- 9. Service-area privacy: private coordinates and street address never leak in get_published_business_by_slug
-- Authenticate as admin to create and publish test service-area listing
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated","app_metadata":{"role":"admin","status":"active"}}', true);

do $$
declare
  v_bid uuid;
begin
  v_bid := public.create_business_for_current_user(
    'Service Area Privacy Business',
    '+91 98888 77773',
    '10000000-0000-0000-0000-000000000001',
    'service_area',
    'Chennai',
    'Tamil Nadu',
    'India',
    'IN',
    null,
    null,
    null,
    null,
    false,
    13.0827,
    80.2707,
    'ChIJ_service_area_place_id'
  );

  insert into public.business_service_areas (business_id, name, city, state, country)
  values (v_bid, 'Central Chennai', 'Chennai', 'Tamil Nadu', 'India');

  update public.businesses
  set business_contact_email = 'service-area-privacy@local.test'
  where id = v_bid;
  perform public.admin_verify_business_contact_email(v_bid);

  -- Transition to published as admin
  perform public.transition_business_publication(v_bid, 'published');
end;
$$;

-- Anonymous role reads published service-area business
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select (result->>'address_line_1') from public.get_published_business_by_slug('service-area-privacy-business') as result),
  null,
  'Service area listing suppresses address_line_1 from public projection'
);

select is(
  (select (result->>'postal_code') from public.get_published_business_by_slug('service-area-privacy-business') as result),
  null,
  'Service area listing suppresses postal_code from public projection'
);

select is(
  (select (result ? 'geo_point') from public.get_published_business_by_slug('service-area-privacy-business') as result),
  false,
  'Public projection never returns raw geo_point'
);

select * from finish();
rollback;
