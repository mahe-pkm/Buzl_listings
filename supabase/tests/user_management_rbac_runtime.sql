begin;
select plan(1);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('40000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-rbac@local.test', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now()),
  ('40000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'onboarding-rbac@local.test', '{"provider":"email","providers":["email"],"role":"buzl_member"}', '{}', now(), now()),
  ('40000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'manager-rbac@local.test', '{"provider":"email","providers":["email"],"role":"buzl_member"}', '{}', now(), now()),
  ('40000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'admin-rbac@local.test', '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now());

update public.profiles set permission_preset = 'listing_manager' where id = '40000000-0000-0000-0000-000000000003';
set local role authenticated;

-- Owner creates a draft, submits it, then cannot publish or self-verify.
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
do $$
declare listing_id uuid;
declare admin_listing_id uuid;
begin
  select public.create_business_for_current_user('Owner Approval Test', '+91 98888 11111', '10000000-0000-0000-0000-000000000001', 'service_area', 'Chennai', 'Tamil Nadu', 'India') into listing_id;
  insert into public.business_service_areas (business_id, name) values (listing_id, 'Chennai');
  perform public.transition_business_publication(listing_id, 'pending');
  if (select publication_status from public.businesses where id = listing_id) <> 'pending' then raise exception 'owner submission did not reach pending'; end if;
  begin perform public.transition_business_publication(listing_id, 'published'); raise exception 'owner publish unexpectedly succeeded'; exception when raise_exception then if position('not authorized' in sqlerrm) = 0 then raise; end if; end;
  begin perform public.set_business_verification(listing_id, 'verified'); raise exception 'owner verification unexpectedly succeeded'; exception when raise_exception then if position('admin role required' in sqlerrm) = 0 then raise; end if; end;
  select public.create_business_for_current_user('Admin Publish Test', '+91 98888 22222', '10000000-0000-0000-0000-000000000001', 'service_area', 'Chennai', 'Tamil Nadu', 'India') into admin_listing_id;
  insert into public.business_service_areas (business_id, name) values (admin_listing_id, 'Tamil Nadu');
  perform public.transition_business_publication(admin_listing_id, 'pending');
  perform set_config('test.manager_listing', listing_id::text, true);
  perform set_config('test.admin_listing', admin_listing_id::text, true);
end $$;

-- Onboarding member cannot publish; Listing Manager and Admin can publish while unverified.
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"buzl_member"}}', true);
do $$ begin if public.has_permission('listing.publish') then raise exception 'onboarding member publish permission unexpectedly granted'; end if; end $$;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"buzl_member"}}', true);
do $$ begin if not public.has_permission('listing.publish') then raise exception 'listing manager publish permission missing'; end if; perform public.transition_business_publication(current_setting('test.manager_listing')::uuid, 'published'); end $$;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated","app_metadata":{"role":"admin"}}', true);
do $$ begin if not public.has_permission('listing.publish') then raise exception 'admin publish permission missing'; end if; perform public.transition_business_publication(current_setting('test.admin_listing')::uuid, 'published'); end $$;

reset role;
update public.profiles set account_status = 'suspended' where id = '40000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
do $$ begin if public.is_account_active() then raise exception 'suspended account remains active'; end if; end $$;

select pass('user management RBAC approval rules passed');
rollback;
