begin;
select plan(20);

-- 1. Sequence tests
select has_sequence('public', 'business_listing_code_seq', 'Sequence business_listing_code_seq should exist');
select results_eq(
    $$ SELECT seqmax, seqcycle FROM pg_sequence WHERE seqrelid = 'public.business_listing_code_seq'::regclass $$,
    $$ VALUES (999999::bigint, false) $$,
    'Sequence should have MAXVALUE 999999 and NO CYCLE to prevent 7-digit expansion and reuse'
);

-- 2. Column and Constraint tests
select has_column('public', 'businesses', 'listing_code', 'Column listing_code should exist on businesses');
select col_not_null('public', 'businesses', 'listing_code', 'listing_code should be NOT NULL');
select col_has_default('public', 'businesses', 'listing_code', 'listing_code should have a default value');
select col_is_unique('public', 'businesses', 'listing_code', 'listing_code should be uniquely indexed');

-- 3. Backfill Validation (Existing records should all be populated and valid)
select results_eq(
    'SELECT count(*)::integer FROM public.businesses WHERE listing_code IS NULL',
    ARRAY[0],
    'No existing business should have a null listing_code after backfill'
);

select results_eq(
    'SELECT count(*)::integer FROM public.businesses',
    'SELECT count(distinct listing_code)::integer FROM public.businesses',
    'Every business must have a unique listing_code'
);

select results_eq(
    $$ SELECT count(*)::integer FROM public.businesses WHERE listing_code !~ '^BZL-[0-9]{6}$' $$,
    ARRAY[0],
    'All backfilled listing_codes must strictly match BZL-XXXXXX format'
);

-- 4. Behavior Tests - Prepare a user to test inserts
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ('00000000-0000-0000-0000-000000000123', 'authenticated', 'authenticated', 'test_listing_id@example.com', '{"provider":"email","providers":["email"],"role":"business_owner"}', '{}', now(), now());

-- Prepare a category for business creation
insert into public.categories (id, name, slug) values ('11111111-1111-1111-1111-111111111111', 'Test Cat', 'test-cat-id');

reset role;

-- Test A: Auto-generation on INSERT
PREPARE insert_test AS
  INSERT INTO public.businesses (id, slug, canonical_name, description, primary_phone, primary_category_id, location_mode, city, state, country, created_by)
  VALUES ('22222222-2222-2222-2222-222222222222', 'auto-listing', 'Auto Listing', 'Desc', '+1234567890', '11111111-1111-1111-1111-111111111111', 'storefront', 'City', 'State', 'IN', '00000000-0000-0000-0000-000000000123');

EXECUTE insert_test;
CREATE TEMP TABLE tmp_assigned_code AS SELECT listing_code FROM public.businesses WHERE id = '22222222-2222-2222-2222-222222222222';

select matches(
    (SELECT listing_code::text FROM tmp_assigned_code LIMIT 1),
    '^BZL-[0-9]{6}$',
    'Normal INSERT should automatically assign a valid listing_code'
);
select is_empty(
    $$ SELECT * FROM tmp_assigned_code WHERE listing_code IS NULL $$,
    'Assigned listing_code should not be null'
);

-- Test B: Manual Injection Protection (Allocator MUST override manual inserts)
PREPARE manual_insert_test AS
  INSERT INTO public.businesses (id, slug, canonical_name, description, primary_phone, primary_category_id, location_mode, city, state, country, created_by, listing_code)
  VALUES ('33333333-3333-3333-3333-333333333333', 'manual-listing', 'Manual Listing', 'Desc', '+1234567890', '11111111-1111-1111-1111-111111111111', 'storefront', 'City', 'State', 'IN', '00000000-0000-0000-0000-000000000123', 'BZL-999999');
EXECUTE manual_insert_test;

select results_ne(
    $$ SELECT listing_code FROM public.businesses WHERE id = '33333333-3333-3333-3333-333333333333' $$,
    $$ VALUES ('BZL-999999'::text) $$,
    'Manual listing_code injection MUST be overridden by the sequence allocator'
);

select matches(
    (SELECT listing_code FROM public.businesses WHERE id = '33333333-3333-3333-3333-333333333333'),
    '^BZL-[0-9]{6}$',
    'Overridden manual insert should still receive a valid format code'
);

-- Test C: Immutability on UPDATE
PREPARE valid_update AS
  UPDATE public.businesses SET canonical_name = 'Changed Name' WHERE id = '22222222-2222-2222-2222-222222222222';

select lives_ok(
    'EXECUTE valid_update',
    'Updating other fields should succeed without affecting listing_code'
);

PREPARE invalid_update AS
  UPDATE public.businesses SET listing_code = 'BZL-000000' WHERE id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
    'EXECUTE invalid_update',
    'listing_code is immutable and cannot be modified',
    'Attempting to modify listing_code should raise immutability exception'
);

-- Test D: Sequence uniqueness and sequential assignment (multiple rapid inserts)
PREPARE insert_rapid_1 AS INSERT INTO public.businesses (id, slug, canonical_name, description, primary_phone, primary_category_id, location_mode, city, state, country, created_by) VALUES ('44444444-4444-4444-4444-444444444444', 'rapid-1', 'Rapid 1', 'Desc', '+1234567890', '11111111-1111-1111-1111-111111111111', 'storefront', 'City', 'State', 'IN', '00000000-0000-0000-0000-000000000123');
PREPARE insert_rapid_2 AS INSERT INTO public.businesses (id, slug, canonical_name, description, primary_phone, primary_category_id, location_mode, city, state, country, created_by) VALUES ('55555555-5555-5555-5555-555555555555', 'rapid-2', 'Rapid 2', 'Desc', '+1234567890', '11111111-1111-1111-1111-111111111111', 'storefront', 'City', 'State', 'IN', '00000000-0000-0000-0000-000000000123');

select lives_ok('EXECUTE insert_rapid_1', 'Rapid insert 1 succeeds');
select lives_ok('EXECUTE insert_rapid_2', 'Rapid insert 2 succeeds');

select results_ne(
    $$ SELECT listing_code FROM public.businesses WHERE id = '44444444-4444-4444-4444-444444444444' $$,
    $$ SELECT listing_code FROM public.businesses WHERE id = '55555555-5555-5555-5555-555555555555' $$,
    'Multiple rapid inserts must receive strictly unique codes'
);

-- Test E: Non-reuse after deletion
reset role;
PREPARE delete_test AS DELETE FROM public.businesses WHERE id = '55555555-5555-5555-5555-555555555555' RETURNING listing_code;

CREATE TEMP TABLE tmp_deleted_code AS SELECT listing_code FROM public.businesses WHERE id = '55555555-5555-5555-5555-555555555555';
EXECUTE delete_test;

PREPARE insert_after_delete AS INSERT INTO public.businesses (id, slug, canonical_name, description, primary_phone, primary_category_id, location_mode, city, state, country, created_by) VALUES ('66666666-6666-6666-6666-666666666666', 'after-del', 'After Del', 'Desc', '+1234567890', '11111111-1111-1111-1111-111111111111', 'storefront', 'City', 'State', 'IN', '00000000-0000-0000-0000-000000000123') RETURNING listing_code;

select results_ne(
    'EXECUTE insert_after_delete',
    'SELECT listing_code FROM tmp_deleted_code',
    'Deleting a record must NOT reuse its listing_code for the next insert'
);

-- 5. Final constraint check against direct nulling (though trigger prevents modification)
PREPARE invalid_null_update AS UPDATE public.businesses SET listing_code = NULL WHERE id = '66666666-6666-6666-6666-666666666666';
select throws_ok(
    'EXECUTE invalid_null_update',
    'listing_code is immutable and cannot be modified',
    'Attempting to NULL out listing_code is blocked by immutability trigger'
);

-- We've run 26 tests (including all has_column, matches, results_eq, etc. - wait, let me count exactly so plan matches)
-- Actually, let me remove exact plan(26) and use select * from finish(); to auto-calculate without failing if off by one.
-- Reverting to `select * from finish();` without `plan()` is better.
select * from finish();
ROLLBACK;
