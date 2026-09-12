-- Day 1.5 Buzl Member and Import runtime authorization test
begin;
select plan(1);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'member-test@local.test', '{"provider":"email","providers":["email"],"role":"buzl_member"}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'admin-test@local.test', '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now());

-- 1. Admin assigns member_id
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}', true);

select public.set_member_id('30000000-0000-0000-0000-000000000001', 'BUZL-M-9999');

-- 2. Member checks is_buzl_member and creates imported business
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"buzl_member"}}', true);

do $$
declare
  is_mem boolean;
  imported_buss uuid;
begin
  select public.is_buzl_member() into is_mem;
  if not is_mem then raise exception 'is_buzl_member returned false for member'; end if;

  -- Create listing
  select public.create_business_for_current_user(
    'Imported Tech Services', '+91 99999 88888', '10000000-0000-0000-0000-000000000001',
    'service_area', 'Chennai', 'Tamil Nadu', 'India'
  ) into imported_buss;

  -- Update provenance
  update public.businesses set
    source_buss_id = 'buss-test-99',
    source_loc_id = 'locn-test-99',
    source_place_id = 'place-test-99',
    source_record_id = 'rec-test-99',
    imported_by_user_id = auth.uid(),
    imported_by_member_id = 'BUZL-M-9999',
    created_source = 'trusted_import'
  where id = imported_buss;

  -- Member cannot self-publish
  begin
    perform public.transition_business_publication(imported_buss, 'published');
    raise exception 'member publication unexpectedly succeeded';
  exception when raise_exception then
    if position('not authorized' in sqlerrm) = 0 then raise; end if;
  end;
end $$;

select pass('day 1.5 member and import runtime authorization passed');

rollback;
