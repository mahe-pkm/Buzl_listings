-- Auth V2 Phase 1 database and privilege regression suite.
-- All rows roll back; no OTP, external provider, staging, or production access.
begin;
select plan(34);

-- Public metadata is untrusted. Even explicit privilege-like keys must not
-- affect trusted app_metadata, profile lifecycle, or member permissions.
insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'auth-v2-owner@local.test',
    '{"provider":"phone","providers":["phone"]}',
    '{"full_name":"Auth V2 Owner","role":"admin","requested_role":"buzl_member","permission_preset":"listing_manager","member_id":"BUZL-M-0001","permissions":["listing.publish"]}',
    now(),
    now()
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'auth-v2-owner-two@local.test',
    '{"provider":"phone","providers":["phone"]}',
    '{"full_name":"Auth V2 Owner Two"}',
    now(),
    now()
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'auth-v2-admin@local.test',
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{"full_name":"Auth V2 Admin"}',
    now(),
    now()
  );

select is(
  (select raw_app_meta_data ->> 'role' from auth.users where id = '60000000-0000-0000-0000-000000000001'),
  'business_owner',
  'public signup metadata cannot inject a trusted role'
);
select is(
  (select account_status::text from public.profiles where id = '60000000-0000-0000-0000-000000000001'),
  'active',
  'public signup profile defaults active'
);
select is(
  (select permission_preset::text from public.profiles where id = '60000000-0000-0000-0000-000000000001'),
  null,
  'public metadata cannot inject listing_manager permission preset'
);
select is(
  (select member_id from public.profiles where id = '60000000-0000-0000-0000-000000000001'),
  null,
  'public metadata cannot inject member ID'
);
select is(
  (select count(*) from public.profiles where id = '60000000-0000-0000-0000-000000000001'),
  1::bigint,
  'one Auth UID provisions exactly one profile'
);
select is(
  (select onboarding_completed_at from public.profiles where id = '60000000-0000-0000-0000-000000000001'),
  null,
  'authentication alone does not complete onboarding'
);
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'onboarding_completed_at', 'UPDATE'),
  'authenticated clients cannot directly update onboarding completion'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}',
  true
);
select set_config('test.onboarding_completed_at', public.complete_user_onboarding()::text, true);
select ok(current_setting('test.onboarding_completed_at')::timestamptz is not null, 'owner completes own onboarding');
select is(
  public.complete_user_onboarding()::text,
  current_setting('test.onboarding_completed_at'),
  'onboarding completion is idempotent'
);
select ok(not public.has_permission('listing.publish'), 'untrusted arbitrary permissions do not grant publication');
reset role;
select is(
  (select onboarding_completed_at from public.profiles where id = '60000000-0000-0000-0000-000000000002'),
  null,
  'completing onboarding cannot modify another profile'
);

-- Create structurally valid drafts owned by the public Business Owner.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}',
  true
);
select set_config(
  'test.missing_email_business',
  public.create_business_for_current_user(
    'Auth V2 Missing Email', '+91 98888 60001',
    '10000000-0000-0000-0000-000000000001', 'service_area',
    'Chennai', 'Tamil Nadu', 'India'
  )::text,
  true
);
select set_config(
  'test.email_business',
  public.create_business_for_current_user(
    'Auth V2 Email Gate', '+91 98888 60002',
    '10000000-0000-0000-0000-000000000001', 'service_area',
    'Chennai', 'Tamil Nadu', 'India'
  )::text,
  true
);
insert into public.business_service_areas (business_id, name)
values
  (current_setting('test.missing_email_business')::uuid, 'Chennai'),
  (current_setting('test.email_business')::uuid, 'Tamil Nadu');
update public.businesses
set business_contact_email = 'owner-business@example.test'
where id = current_setting('test.email_business')::uuid;

select is(
  (select publication_status::text from public.businesses where id = current_setting('test.email_business')::uuid),
  'draft',
  'unverified business email is allowed on a draft'
);

do $$
begin
  begin
    perform public.transition_business_publication(current_setting('test.missing_email_business')::uuid, 'pending');
    raise exception 'missing-email business submitted';
  exception when raise_exception then
    if position('verified business contact email required' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('missing business email is denied at submission');

do $$
begin
  begin
    perform public.transition_business_publication(current_setting('test.email_business')::uuid, 'pending');
    raise exception 'unverified-email business submitted';
  exception when raise_exception then
    if position('must be verified before submission' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('unverified business email is denied at submission');

do $$
begin
  begin
    update public.businesses
    set business_contact_email_verified_at = now()
    where id = current_setting('test.email_business')::uuid;
    raise exception 'owner directly verified business email';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select pass('owner cannot directly update business email verification timestamp');

do $$
begin
  begin
    perform public.admin_verify_business_contact_email(current_setting('test.email_business')::uuid);
    raise exception 'owner called admin verification RPC';
  exception when raise_exception then
    if position('admin role required' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('owner cannot call admin business-email verification');

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);
select set_config(
  'test.first_verified_at',
  public.admin_verify_business_contact_email(current_setting('test.email_business')::uuid)::text,
  true
);
select ok(
  (select business_contact_email_verified_at is not null from public.businesses where id = current_setting('test.email_business')::uuid),
  'admin can manually verify a non-empty business contact email'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}',
  true
);
update public.businesses
set business_contact_email = 'OWNER-BUSINESS@EXAMPLE.TEST'
where id = current_setting('test.email_business')::uuid;
select is(
  (select business_contact_email_verified_at::text from public.businesses where id = current_setting('test.email_business')::uuid),
  current_setting('test.first_verified_at'),
  'case-only email change preserves verification'
);
update public.businesses
set business_contact_email = 'changed-business@example.test'
where id = current_setting('test.email_business')::uuid;
select is(
  (select business_contact_email_verified_at from public.businesses where id = current_setting('test.email_business')::uuid),
  null,
  'effective email change resets verification'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);
select public.admin_verify_business_contact_email(current_setting('test.email_business')::uuid);
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}',
  true
);
select public.transition_business_publication(current_setting('test.email_business')::uuid, 'pending');
select is(
  (select publication_status::text from public.businesses where id = current_setting('test.email_business')::uuid),
  'pending',
  'verified business email plus existing requirements allows submission'
);
do $$
begin
  begin
    perform public.transition_business_publication(current_setting('test.email_business')::uuid, 'published');
    raise exception 'owner published business';
  exception when raise_exception then
    if position('not authorized' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('owner still cannot publish');
reset role;

-- The challenge table is private. Only the trusted service role can access the
-- rows or invoke the consume primitive.
select ok(
  not has_table_privilege('anon', 'public.business_email_verification_challenges', 'SELECT')
  and not has_table_privilege('anon', 'public.business_email_verification_challenges', 'INSERT'),
  'anon has no direct challenge-table access'
);
select ok(
  not has_table_privilege('authenticated', 'public.business_email_verification_challenges', 'SELECT')
  and not has_table_privilege('authenticated', 'public.business_email_verification_challenges', 'INSERT')
  and not has_table_privilege('authenticated', 'public.business_email_verification_challenges', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.business_email_verification_challenges', 'DELETE'),
  'authenticated users have no direct challenge-table access'
);
select ok(
  not has_function_privilege('authenticated', 'public.consume_business_email_verification_challenge(uuid,bytea)', 'EXECUTE'),
  'authenticated users cannot invoke challenge consumption'
);

insert into public.business_email_verification_challenges (
  business_id, normalized_email, token_hash, expires_at
)
values (
  current_setting('test.email_business')::uuid,
  'changed-business@example.test',
  digest('auth-v2-unique-token', 'sha256'),
  now() + interval '15 minutes'
);
do $$
begin
  begin
    insert into public.business_email_verification_challenges (
      business_id, normalized_email, token_hash, expires_at
    ) values (
      current_setting('test.email_business')::uuid,
      'changed-business@example.test',
      digest('auth-v2-unique-token', 'sha256'),
      now() + interval '15 minutes'
    );
    raise exception 'duplicate token hash accepted';
  exception when unique_violation then null;
  end;
end;
$$;
select pass('challenge token hashes are unique');

insert into public.business_email_verification_challenges (
  business_id, normalized_email, token_hash, created_at, expires_at
)
values (
  current_setting('test.email_business')::uuid,
  'changed-business@example.test',
  digest('auth-v2-expired-token', 'sha256'),
  now() - interval '30 minutes',
  now() - interval '15 minutes'
);
do $$
begin
  begin
    perform public.consume_business_email_verification_challenge(
      current_setting('test.email_business')::uuid,
      digest('auth-v2-expired-token', 'sha256')
    );
    raise exception 'expired challenge consumed';
  exception when raise_exception then
    if position('challenge expired' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('expired challenge is rejected');

insert into public.business_email_verification_challenges (
  business_id, normalized_email, token_hash, expires_at, consumed_at
)
values (
  current_setting('test.email_business')::uuid,
  'changed-business@example.test',
  digest('auth-v2-consumed-token', 'sha256'),
  now() + interval '15 minutes',
  now()
);
do $$
begin
  begin
    perform public.consume_business_email_verification_challenge(
      current_setting('test.email_business')::uuid,
      digest('auth-v2-consumed-token', 'sha256')
    );
    raise exception 'consumed challenge replayed';
  exception when raise_exception then
    if position('already consumed' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('already-consumed challenge is rejected');

insert into public.business_email_verification_challenges (
  business_id, normalized_email, token_hash, expires_at
)
values (
  current_setting('test.email_business')::uuid,
  'changed-business@example.test',
  digest('auth-v2-business-mismatch', 'sha256'),
  now() + interval '15 minutes'
);
do $$
begin
  begin
    perform public.consume_business_email_verification_challenge(
      current_setting('test.missing_email_business')::uuid,
      digest('auth-v2-business-mismatch', 'sha256')
    );
    raise exception 'business-mismatched challenge consumed';
  exception when raise_exception then
    if position('invalid verification challenge' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('business-mismatched challenge is rejected');

insert into public.business_email_verification_challenges (
  business_id, normalized_email, token_hash, expires_at
)
values (
  current_setting('test.email_business')::uuid,
  'changed-business@example.test',
  digest('auth-v2-email-mismatch', 'sha256'),
  now() + interval '15 minutes'
);
update public.businesses
set business_contact_email = 'new-current-email@example.test'
where id = current_setting('test.email_business')::uuid;
do $$
begin
  begin
    perform public.consume_business_email_verification_challenge(
      current_setting('test.email_business')::uuid,
      digest('auth-v2-email-mismatch', 'sha256')
    );
    raise exception 'email-mismatched challenge consumed';
  exception when raise_exception then
    if position('no longer matches' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('email-mismatched challenge is rejected');

insert into public.business_email_verification_challenges (
  business_id, normalized_email, token_hash, expires_at
)
values (
  current_setting('test.email_business')::uuid,
  'new-current-email@example.test',
  digest('auth-v2-success-token', 'sha256'),
  now() + interval '15 minutes'
);
select public.consume_business_email_verification_challenge(
  current_setting('test.email_business')::uuid,
  digest('auth-v2-success-token', 'sha256')
);
select ok(
  (select business_contact_email_verified_at is not null from public.businesses where id = current_setting('test.email_business')::uuid),
  'valid challenge marks the exact current business email verified'
);
select ok(
  (select consumed_at is not null from public.business_email_verification_challenges where token_hash = digest('auth-v2-success-token', 'sha256')),
  'successful challenge consumption records single-use timestamp'
);
do $$
begin
  begin
    perform public.consume_business_email_verification_challenge(
      current_setting('test.email_business')::uuid,
      digest('auth-v2-success-token', 'sha256')
    );
    raise exception 'successful challenge replayed';
  exception when raise_exception then
    if position('already consumed' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;
select pass('successful challenge cannot be replayed');

-- Legacy published rows remain operational without inventing verification
-- history. New transitions still use the stricter submission gate.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"business_owner"}}',
  true
);
select set_config(
  'test.legacy_published_business',
  public.create_business_for_current_user(
    'Auth V2 Legacy Published', '+91 98888 60003',
    '10000000-0000-0000-0000-000000000001', 'service_area',
    'Chennai', 'Tamil Nadu', 'India'
  )::text,
  true
);
insert into public.business_service_areas (business_id, name)
values (current_setting('test.legacy_published_business')::uuid, 'Chennai');
update public.businesses
set business_contact_email = 'legacy-unverified@example.test'
where id = current_setting('test.legacy_published_business')::uuid;
reset role;
update public.businesses
set publication_status = 'published'
where id = current_setting('test.legacy_published_business')::uuid;
select is(
  (select business_contact_email_verified_at from public.businesses where id = current_setting('test.legacy_published_business')::uuid),
  null,
  'legacy published email is not falsely backfilled as verified'
);
update public.businesses
set description = 'Legacy published row remains editable after migration'
where id = current_setting('test.legacy_published_business')::uuid;
select is(
  (select publication_status::text from public.businesses where id = current_setting('test.legacy_published_business')::uuid),
  'published',
  'legacy published row remains operational without fake verification'
);

select * from finish();
rollback;
