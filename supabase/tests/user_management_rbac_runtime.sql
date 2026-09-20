begin;
select plan(4);

-- A normal public Auth signup supplies user_metadata only. The trusted trigger
-- must assign the least-privileged role without accepting a client role value.
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('40000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'public-signup-rbac@local.test', '{"provider":"email","providers":["email"]}', '{"full_name":"Public Owner"}', now(), now());

select is(
  (select raw_app_meta_data ->> 'role' from auth.users where id = '40000000-0000-0000-0000-000000000000'),
  'business_owner',
  'public signup defaults to business_owner'
);

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
  update public.businesses set business_contact_email = 'owner-approval@local.test' where id = listing_id;
  perform set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated","app_metadata":{"role":"admin"}}', true);
  perform public.admin_verify_business_contact_email(listing_id);
  perform set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
  perform public.transition_business_publication(listing_id, 'pending');
  if (select publication_status from public.businesses where id = listing_id) <> 'pending' then raise exception 'owner submission did not reach pending'; end if;
  begin perform public.transition_business_publication(listing_id, 'published'); raise exception 'owner publish unexpectedly succeeded'; exception when raise_exception then if position('not authorized' in sqlerrm) = 0 then raise; end if; end;
  begin perform public.set_business_verification(listing_id, 'verified'); raise exception 'owner verification unexpectedly succeeded'; exception when raise_exception then if position('admin role required' in sqlerrm) = 0 then raise; end if; end;
  select public.create_business_for_current_user('Admin Publish Test', '+91 98888 22222', '10000000-0000-0000-0000-000000000001', 'service_area', 'Chennai', 'Tamil Nadu', 'India') into admin_listing_id;
  insert into public.business_service_areas (business_id, name) values (admin_listing_id, 'Tamil Nadu');
  update public.businesses set business_contact_email = 'admin-publish@local.test' where id = admin_listing_id;
  perform set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated","app_metadata":{"role":"admin"}}', true);
  perform public.admin_verify_business_contact_email(admin_listing_id);
  perform set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
  perform public.transition_business_publication(admin_listing_id, 'pending');
  perform set_config('test.manager_listing', listing_id::text, true);
  perform set_config('test.admin_listing', admin_listing_id::text, true);
end $$;

-- Listing verification status remains independent: the contact emails are
-- verified, while listing verification remains unverified.
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"buzl_member"}}', true);
do $$ begin if public.has_permission('listing.publish') then raise exception 'onboarding member publish permission unexpectedly granted'; end if; end $$;
select is(
  (select count(*) from public.businesses where id = current_setting('test.manager_listing')::uuid),
  0::bigint,
  'onboarding member cannot read the moderation queue'
);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"buzl_member"}}', true);
select is(
  (select count(*) from public.businesses where id = current_setting('test.manager_listing')::uuid),
  1::bigint,
  'listing manager can read the moderation queue'
);
do $$ begin if not public.has_permission('listing.publish') then raise exception 'listing manager publish permission missing'; end if; perform public.transition_business_publication(current_setting('test.manager_listing')::uuid, 'published'); end $$;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated","app_metadata":{"role":"admin"}}', true);
do $$ begin if not public.has_permission('listing.publish') then raise exception 'admin publish permission missing'; end if; perform public.transition_business_publication(current_setting('test.admin_listing')::uuid, 'published'); end $$;

reset role;
update public.profiles set account_status = 'suspended' where id = '40000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
do $$
begin
  if public.is_account_active() then raise exception 'suspended account remains active'; end if;
  begin
    perform public.create_business_for_current_user('Suspended owner denied', '+91 98888 33333', '10000000-0000-0000-0000-000000000001', 'service_area', 'Chennai', 'Tamil Nadu', 'India');
    raise exception 'suspended account created a listing';
  exception when raise_exception then
    if position('active account required' in sqlerrm) = 0 then raise; end if;
  end;
end $$;

select pass('user management RBAC approval rules passed');
rollback;
