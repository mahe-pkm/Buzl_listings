-- Local runtime & RLS test suite for Business Profile Expansion
begin;
select plan(20);

-- 1. Setup test users and business
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'expansion_owner@buzl.test', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'other_owner@buzl.test', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'admin_tester@buzl.test', '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now())
on conflict (id) do nothing;

-- Authenticate as expansion_owner
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);

-- Create test business via RPC
select public.create_business_for_current_user(
  'Expansion Store',
  '+91 98765 43210',
  '10000000-0000-0000-0000-000000000001'::uuid,
  'storefront'::public.location_mode,
  'Chennai',
  'Tamil Nadu',
  'India',
  'IN',
  '123 Expansion Street',
  null,
  'T Nagar',
  '600017',
  true,
  13.0418,
  80.2341
);

do $$
declare
  v_biz_id uuid;
  i int;
begin
  select id into v_biz_id from public.businesses where canonical_name = 'Expansion Store';
  if v_biz_id is null then raise exception 'Test business creation failed'; end if;

  -- 1. Test google_business_profile_url update
  update public.businesses
  set google_business_profile_url = 'https://maps.google.com/?cid=1234567890'
  where id = v_biz_id;

  -- 2. Insert 20 services with description (must succeed)
  for i in 1..20 loop
    insert into public.business_services (business_id, service_name, service_description, sort_order)
    values (v_biz_id, 'Service ' || i, 'Description for service ' || i, i);
  end loop;

  -- 3. 21st service must be rejected
  begin
    insert into public.business_services (business_id, service_name, service_description)
    values (v_biz_id, 'Service 21', 'Overflow service');
    raise exception '21st service insertion unexpectedly succeeded';
  exception when raise_exception then
    if position('A business cannot have more than 20 services' in sqlerrm) = 0 then raise; end if;
  end;

  -- 4. Insert 20 products (must succeed)
  for i in 1..20 loop
    insert into public.business_products (business_id, name, description, image_path, sort_order)
    values (v_biz_id, 'Product ' || i, 'Description for product ' || i, 'business-media/' || v_biz_id || '/products/p' || i || '.jpg', i);
  end loop;

  -- 5. 21st product must be rejected
  begin
    insert into public.business_products (business_id, name, description)
    values (v_biz_id, 'Product 21', 'Overflow product');
    raise exception '21st product insertion unexpectedly succeeded';
  exception when raise_exception then
    if position('A business cannot have more than 20 products' in sqlerrm) = 0 then raise; end if;
  end;

  -- 6. Insert logo
  insert into public.business_media (business_id, kind, storage_path, mime_type, byte_size)
  values (v_biz_id, 'logo', 'business-media/' || v_biz_id || '/logo/logo.jpg', 'image/jpeg', 102400);

  -- 7. Duplicate logo must fail singleton constraint
  begin
    insert into public.business_media (business_id, kind, storage_path, mime_type, byte_size)
    values (v_biz_id, 'logo', 'business-media/' || v_biz_id || '/logo/logo2.jpg', 'image/jpeg', 102400);
    raise exception 'duplicate logo insertion unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;

  -- 8. Insert multiple gallery media items (must succeed)
  insert into public.business_media (business_id, kind, storage_path, mime_type, byte_size, sort_order, caption)
  values
    (v_biz_id, 'gallery', 'business-media/' || v_biz_id || '/gallery/img1.jpg', 'image/jpeg', 204800, 1, 'Front View'),
    (v_biz_id, 'gallery', 'business-media/' || v_biz_id || '/gallery/img2.jpg', 'image/jpeg', 304800, 2, 'Showroom');
end $$;

-- Test assertions for owner actions
select is(
  (select google_business_profile_url from public.businesses where canonical_name = 'Expansion Store'),
  'https://maps.google.com/?cid=1234567890',
  'GBP URL updates and persists'
);

select is(
  (select count(*)::int from public.business_services s join public.businesses b on b.id = s.business_id where b.canonical_name = 'Expansion Store'),
  20,
  'Exactly 20 services accepted'
);

select is(
  (select s.service_description from public.business_services s join public.businesses b on b.id = s.business_id where b.canonical_name = 'Expansion Store' and s.service_name = 'Service 1'),
  'Description for service 1',
  'Service description persists'
);

select is(
  (select count(*)::int from public.business_products p join public.businesses b on b.id = p.business_id where b.canonical_name = 'Expansion Store'),
  20,
  'Exactly 20 products accepted'
);

select is(
  (select p.description from public.business_products p join public.businesses b on b.id = p.business_id where b.canonical_name = 'Expansion Store' and p.name = 'Product 1'),
  'Description for product 1',
  'Product description persists'
);

select is(
  (select count(*)::int from public.business_media m join public.businesses b on b.id = m.business_id where b.canonical_name = 'Expansion Store' and m.kind = 'gallery'),
  2,
  'Multiple gallery media items allowed'
);

select is(
  (select m.caption from public.business_media m join public.businesses b on b.id = m.business_id where b.canonical_name = 'Expansion Store' and m.storage_path like '%img1.jpg'),
  'Front View',
  'Gallery caption persists'
);

-- RLS Isolation: switch to other_owner
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);

select is(
  (select count(*)::int from public.business_products p join public.businesses b on b.id = p.business_id where b.canonical_name = 'Expansion Store'),
  0,
  'Other owner cannot select products from unmanaged business'
);

select is(
  (select count(*)::int from public.business_media m join public.businesses b on b.id = m.business_id where b.canonical_name = 'Expansion Store'),
  0,
  'Other owner cannot select media from unmanaged business'
);

do $$
declare v_biz_id uuid;
begin
  select id into v_biz_id from public.businesses where canonical_name = 'Expansion Store';
  begin
    insert into public.business_products (business_id, name) values (v_biz_id, 'Hacked Product');
    raise exception 'unauthorized product insert succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.business_media (business_id, kind, storage_path, mime_type, byte_size)
    values (v_biz_id, 'gallery', 'business-media/hack.jpg', 'image/jpeg', 100);
    raise exception 'unauthorized media insert succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

select pass('Other owner cannot insert product or media into unmanaged business');

-- Anonymous / Public view check
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

-- Draft business returns null for public reader
select is(
  public.get_published_business_by_slug('expansion-store'),
  null,
  'Anonymous reader returns null for draft business'
);

-- Owner transitions to pending
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
set local role authenticated;
do $$
declare v_biz_id uuid;
begin
  select id into v_biz_id from public.businesses where canonical_name = 'Expansion Store';
  perform public.transition_business_publication(v_biz_id, 'pending');
end $$;

-- Elevate to admin to publish the business
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"admin"}}', true);

do $$
declare v_biz_id uuid;
begin
  select id into v_biz_id from public.businesses where canonical_name = 'Expansion Store';
  perform public.transition_business_publication(v_biz_id, 'published');
end $$;

-- Switch back to anon
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

-- Verify public reader returns expanded fields on published business
select ok(
  public.get_published_business_by_slug('expansion-store') is not null,
  'Public reader returns published business'
);

select is(
  (public.get_published_business_by_slug('expansion-store') ->> 'google_business_profile_url'),
  'https://maps.google.com/?cid=1234567890',
  'Public reader outputs google_business_profile_url'
);

select is(
  jsonb_array_length(public.get_published_business_by_slug('expansion-store') -> 'services'),
  20,
  'Public reader returns all 20 services'
);

select is(
  (public.get_published_business_by_slug('expansion-store') -> 'services' -> 0 ->> 'service_description'),
  'Description for service 1',
  'Public reader returns service description'
);

select is(
  jsonb_array_length(public.get_published_business_by_slug('expansion-store') -> 'products'),
  20,
  'Public reader returns all 20 products'
);

select is(
  (public.get_published_business_by_slug('expansion-store') -> 'products' -> 0 ->> 'name'),
  'Product 1',
  'Public reader returns product name'
);

select is(
  jsonb_array_length(public.get_published_business_by_slug('expansion-store') -> 'media'),
  3,
  'Public reader returns 3 media items (1 logo, 2 gallery)'
);

select is(
  (public.get_published_business_by_slug('expansion-store') -> 'media' -> 1 ->> 'kind'),
  'gallery',
  'Public reader returns gallery media role'
);

select is(
  (public.get_published_business_by_slug('expansion-store') -> 'media' -> 1 ->> 'caption'),
  'Front View',
  'Public reader returns gallery caption'
);

select * from finish();
rollback;
