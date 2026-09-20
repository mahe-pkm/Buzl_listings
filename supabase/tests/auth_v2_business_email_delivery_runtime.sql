-- Auth V2 Phase 3 challenge issuance/consumption regression suite.
begin;
select plan(14);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('61000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'phase3-owner@local.test', '{"provider":"email","providers":["email"]}', '{"full_name":"Phase 3 Owner"}', now(), now()),
  ('61000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'phase3-other@local.test', '{"provider":"email","providers":["email"]}', '{"full_name":"Phase 3 Other"}', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
select set_config('test.phase3_business', public.create_business_for_current_user(
  'Phase 3 Email Business', '+91 98888 61001',
  '10000000-0000-0000-0000-000000000001', 'service_area',
  'Chennai', 'Tamil Nadu', 'India'
)::text, true);
update public.businesses set business_contact_email = 'CONTACT@EXAMPLE.TEST'
where id = current_setting('test.phase3_business')::uuid;

select lives_ok(
  format('select * from public.create_business_email_verification_challenge(%L::uuid, digest(%L, %L))', current_setting('test.phase3_business'), 'phase3-token-one', 'sha256'),
  'owner can request a verification challenge for own business'
);
reset role;

select is(
  (select normalized_email from public.business_email_verification_challenges where business_id = current_setting('test.phase3_business')::uuid),
  'contact@example.test',
  'challenge stores normalized listing email'
);
select is(
  (select token_hash from public.business_email_verification_challenges where business_id = current_setting('test.phase3_business')::uuid),
  digest('phase3-token-one', 'sha256'),
  'challenge stores only the supplied SHA-256 digest'
);
select is(
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'business_email_verification_challenges' and column_name in ('token', 'plaintext_token')),
  0::bigint,
  'challenge table has no plaintext token column'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
select throws_ok(
  format('select * from public.create_business_email_verification_challenge(%L::uuid, digest(%L, %L))', current_setting('test.phase3_business'), 'phase3-too-soon', 'sha256'),
  'P0001', 'verification email was requested recently',
  'rapid resend is rate limited'
);
reset role;

update public.business_email_verification_challenges set created_at = now() - interval '2 minutes'
where business_id = current_setting('test.phase3_business')::uuid;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
select lives_ok(
  format('select * from public.create_business_email_verification_challenge(%L::uuid, digest(%L, %L))', current_setting('test.phase3_business'), 'phase3-token-two', 'sha256'),
  'owner can replace an older challenge'
);
reset role;

select is(
  (select count(*) from public.business_email_verification_challenges where business_id = current_setting('test.phase3_business')::uuid and consumed_at is null),
  1::bigint,
  'replacement leaves exactly one active challenge'
);
select ok(
  (select consumed_at is not null from public.business_email_verification_challenges where token_hash = digest('phase3-token-one', 'sha256')),
  'replacement invalidates the older challenge'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"business_owner"}}', true);
select throws_ok(
  format('select * from public.create_business_email_verification_challenge(%L::uuid, digest(%L, %L))', current_setting('test.phase3_business'), 'phase3-other-token', 'sha256'),
  'P0001', 'business management authorization required',
  'owner cannot request a challenge for another business'
);
select ok(
  not has_function_privilege('authenticated', 'public.consume_business_email_verification_token(bytea)', 'EXECUTE'),
  'authenticated clients cannot consume opaque verification tokens directly'
);
reset role;

set local role service_role;
select lives_ok(
  $$select * from public.consume_business_email_verification_token(digest('phase3-token-two', 'sha256'))$$,
  'trusted server consumes a valid opaque token'
);
reset role;
select ok(
  (select business_contact_email_verified_at is not null from public.businesses where id = current_setting('test.phase3_business')::uuid),
  'valid token verifies the current business contact email'
);

set local role service_role;
select throws_ok(
  $$select * from public.consume_business_email_verification_token(digest('phase3-token-two', 'sha256'))$$,
  'P0001', 'verification challenge already consumed',
  'token replay is rejected'
);
reset role;

insert into public.business_email_verification_challenges (business_id, normalized_email, token_hash, expires_at, created_at)
values (
  current_setting('test.phase3_business')::uuid,
  'contact@example.test',
  digest('phase3-expired-token', 'sha256'),
  now() - interval '1 minute',
  now() - interval '31 minutes'
);
set local role service_role;
select throws_ok(
  $$select * from public.consume_business_email_verification_token(digest('phase3-expired-token', 'sha256'))$$,
  'P0001', 'verification challenge expired',
  'expired token is rejected'
);
reset role;

select * from finish();
rollback;
