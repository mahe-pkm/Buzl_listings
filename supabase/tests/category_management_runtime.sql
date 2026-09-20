begin;
select plan(5);

-- 1. Insert test admin and test business owner
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('50000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'cat-owner@local.test', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now()),
  ('50000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'cat-admin@local.test', '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now());

set local role authenticated;

-- Test 1: Authenticated non-admin cannot insert into categories
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);

do $$
begin
  insert into public.categories (name, slug) values ('Unauthorized Category', 'unauthorized-cat');
  raise exception 'non-admin category insert unexpectedly succeeded';
exception
  when insufficient_privilege then
    -- Expected: RLS policy categories_admin_manage forbids insert
    null;
end $$;

select pass('non-admin is denied from inserting categories by RLS');

-- Test 2: Authenticated non-admin cannot update categories (0 rows modified, name remains unchanged)
do $$
declare
  rows_affected int;
begin
  update public.categories set name = 'Hacked Category' where slug = 'restaurant';
  get diagnostics rows_affected = row_count;
  if rows_affected > 0 then
    raise exception 'non-admin category update unexpectedly updated % rows', rows_affected;
  end if;
  if (select name from public.categories where slug = 'restaurant') = 'Hacked Category' then
    raise exception 'non-admin category update unexpectedly altered category name';
  end if;
end $$;

select pass('non-admin is denied from updating categories by RLS (zero rows affected)');

-- Switch to Admin role
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}', true);

-- Test 3: Admin can insert category, but duplicate slug is rejected by unique constraint
insert into public.categories (id, name, slug, sort_order, active)
values ('51000000-0000-0000-0000-000000000001', 'Taxonomy Test Category', 'taxonomy-test-cat', 10, true);

do $$
begin
  insert into public.categories (name, slug)
  values ('Duplicate Taxonomy Category', 'taxonomy-test-cat');
  raise exception 'duplicate slug insertion unexpectedly succeeded';
exception
  when unique_violation then
    -- Expected: unique constraint violation on slug
    null;
end $$;

select pass('slug uniqueness constraint prevents duplicate category slugs');

-- Test 4: Deactivation trigger blocks deactivating a category used by a published business
-- Create a published business pointing to our test category
do $$
declare
  test_biz_id uuid;
begin
  -- Set local role back to service_role temporarily to seed business or use create_business
  select public.create_business_for_current_user(
    'Taxonomy Guard Business',
    '+91 99999 88881',
    '51000000-0000-0000-0000-000000000001',
    'service_area',
    'Chennai',
    'Tamil Nadu',
    'India'
  ) into test_biz_id;

  insert into public.business_service_areas (business_id, name) values (test_biz_id, 'Chennai');
  update public.businesses
  set business_contact_email = 'taxonomy-guard@local.test'
  where id = test_biz_id;
  perform public.admin_verify_business_contact_email(test_biz_id);
  perform public.transition_business_publication(test_biz_id, 'pending');
  perform public.transition_business_publication(test_biz_id, 'published');

  -- Attempt to deactivate category
  begin
    update public.categories set active = false where id = '51000000-0000-0000-0000-000000000001';
    raise exception 'published category deactivation unexpectedly succeeded';
  exception
    when raise_exception then
      if position('cannot deactivate a category used by a published business' in sqlerrm) > 0 then
        null; -- Expected trigger exception
      else
        raise;
      end if;
  end;
end $$;

select pass('prevent_published_category_deactivation trigger stops deactivating category with published listing');

-- Test 5: Child category references parent with on delete restrict
insert into public.categories (id, name, slug, parent_id, sort_order, active)
values ('51000000-0000-0000-0000-000000000002', 'Child Taxonomy Category', 'child-taxonomy-cat', '51000000-0000-0000-0000-000000000001', 1, true);

do $$
begin
  delete from public.categories where id = '51000000-0000-0000-0000-000000000001';
  raise exception 'parent category delete unexpectedly succeeded despite child category reference';
exception
  when foreign_key_violation then
    -- Expected: on delete restrict on parent_id
    null;
end $$;

select pass('foreign key restrict protects parent category from deletion when children exist');

select * from finish();
rollback;
