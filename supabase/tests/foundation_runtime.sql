-- Local-only Day 1 runtime authorization test. It rolls back all test data.
begin;
select plan(1);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-a@local.test', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'owner-b@local.test', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now()),
  ('20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'admin@local.test', '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);

select public.create_business_for_current_user('Owner A Service', '+91 98765 43210', '10000000-0000-0000-0000-000000000001', 'service_area', 'Bengaluru', 'Karnataka', 'India');

do $$
declare a_business uuid;
begin
  select id into a_business from public.businesses where canonical_name = 'Owner A Service';
  if a_business is null then raise exception 'owner A cannot read their created business'; end if;
  if not exists (select 1 from public.business_managers where business_id = a_business and user_id = auth.uid()) then raise exception 'owner manager bootstrap missing'; end if;
  update public.businesses set business_contact_email = 'hidden@local.test', show_email = false where id = a_business;
  begin
    insert into public.business_managers (business_id, user_id) values (a_business, '20000000-0000-0000-0000-000000000002');
    raise exception 'owner manager escalation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.businesses set verification_status = 'verified' where id = a_business;
    raise exception 'owner verification update unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.businesses set publication_status = 'published' where id = a_business;
    raise exception 'owner publication update unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.businesses set primary_phone_normalized = '1111111' where id = a_business;
    raise exception 'owner normalized-field update unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Invalid storefront, service-area, and hybrid records cannot submit.
select public.create_business_for_current_user('Invalid Storefront', '+91 98765 43211', '10000000-0000-0000-0000-000000000001', 'storefront', 'Bengaluru', 'Karnataka', 'India');
select public.create_business_for_current_user('Invalid Service Area', '+91 98765 43212', '10000000-0000-0000-0000-000000000001', 'service_area', 'Bengaluru', 'Karnataka', 'India');
select public.create_business_for_current_user('Invalid Hybrid', '+91 98765 43213', '10000000-0000-0000-0000-000000000001', 'hybrid', 'Bengaluru', 'Karnataka', 'India', 'IN', '1 Test Street', null, 'Indiranagar', '560038', true, 12.9716, 77.5946);
select public.create_business_for_current_user('Valid Storefront', '+91 98765 43214', '10000000-0000-0000-0000-000000000001', 'storefront', 'Bengaluru', 'Karnataka', 'India', 'IN', '2 Test Street', null, 'Indiranagar', '560038', true, 12.9716, 77.5946);

update public.businesses
set business_contact_email = lower(replace(canonical_name, ' ', '-')) || '@local.test'
where canonical_name in ('Invalid Storefront', 'Invalid Service Area', 'Invalid Hybrid', 'Valid Storefront');
reset role;
update public.businesses
set business_contact_email_verified_at = now()
where canonical_name in ('Invalid Hybrid', 'Valid Storefront');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);

do $$
declare invalid_storefront uuid; invalid_service_area uuid; invalid_hybrid uuid; valid_storefront uuid;
begin
  select id into invalid_storefront from public.businesses where canonical_name = 'Invalid Storefront';
  select id into invalid_service_area from public.businesses where canonical_name = 'Invalid Service Area';
  select id into invalid_hybrid from public.businesses where canonical_name = 'Invalid Hybrid';
  select id into valid_storefront from public.businesses where canonical_name = 'Valid Storefront';
  begin perform public.transition_business_publication(invalid_storefront, 'pending'); raise exception 'invalid storefront submitted'; exception when raise_exception then if position('storefront publication requires' in sqlerrm) = 0 then raise; end if; end;
  begin perform public.transition_business_publication(invalid_service_area, 'pending'); raise exception 'invalid service area submitted'; exception when raise_exception then if position('service-area publication requires' in sqlerrm) = 0 then raise; end if; end;
  begin perform public.transition_business_publication(invalid_hybrid, 'pending'); raise exception 'invalid hybrid submitted'; exception when raise_exception then if position('service-area publication requires' in sqlerrm) = 0 then raise; end if; end;
  perform public.transition_business_publication(valid_storefront, 'pending');
  insert into public.business_service_areas (business_id, name, city, state, country) values (invalid_hybrid, 'Koramangala', 'Bengaluru', 'Karnataka', 'India');
  perform public.transition_business_publication(invalid_hybrid, 'pending');
end $$;

insert into public.business_service_areas (business_id, name, city, state, country)
select id, 'Bengaluru', 'Bengaluru', 'Karnataka', 'India'
from public.businesses where canonical_name = 'Owner A Service';

update public.businesses
set business_contact_email = 'owner-a-service@local.test'
where canonical_name = 'Owner A Service';
reset role;
update public.businesses
set business_contact_email_verified_at = now()
where canonical_name = 'Owner A Service';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
do $$
begin
  if exists (select 1 from public.businesses where canonical_name = 'Owner A Service') then raise exception 'owner B can read owner A business'; end if;
  update public.businesses set description = 'cross-owner write' where canonical_name = 'Owner A Service';
  if found then raise exception 'owner B can modify owner A business'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"admin"}}', true);
do $$
declare a_business uuid;
begin
  select id into a_business from public.businesses where canonical_name = 'Owner A Service';
  perform public.transition_business_publication(a_business, 'published');
  if not exists (select 1 from public.businesses where id = a_business and publication_status = 'published' and verification_status = 'unverified') then raise exception 'admin publish or state independence failed'; end if;
end $$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform 1 from public.businesses;
    raise exception 'anon base-table business read leaked';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.business_managers;
    raise exception 'anon manager read leaked';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.get_published_business_public('owner-a-service') where business_contact_email is not null) then raise exception 'hidden email leaked'; end if;
end $$;

select pass('Day 1 runtime authorization boundaries passed');
select * from finish();
rollback;
