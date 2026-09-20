-- Auth Architecture V2, Phase 1: database foundation.
-- Adds explicit onboarding completion, business-contact-email verification,
-- private verification challenges, and server-enforced submission gating.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Existing internal users and users with an established business relationship
-- have already passed the onboarding boundary. Other existing profiles remain
-- incomplete; authentication alone never marks onboarding complete.
update public.profiles profile
set onboarding_completed_at = coalesce(profile.updated_at, profile.created_at, now())
where profile.onboarding_completed_at is null
  and (
    exists (
      select 1
      from auth.users auth_user
      where auth_user.id = profile.id
        and auth_user.raw_app_meta_data ->> 'role' in ('admin', 'buzl_member')
    )
    or exists (
      select 1
      from public.business_managers manager
      where manager.user_id = profile.id
    )
  );

-- Profiles are provisioned by the trusted auth.users trigger. Removing direct
-- INSERT closes the table-level privilege that would otherwise include future
-- columns such as onboarding_completed_at. full_name remains the only client-
-- editable profile column.
revoke insert on public.profiles from authenticated;
revoke update (onboarding_completed_at) on public.profiles from authenticated;

create or replace function public.complete_user_onboarding()
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  completed_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = auth.uid()
    and account_status = 'active'
  returning onboarding_completed_at into completed_at;

  if completed_at is null then
    raise exception 'active profile required';
  end if;

  return completed_at;
end;
$$;

revoke all on function public.complete_user_onboarding() from public, anon;
grant execute on function public.complete_user_onboarding() to authenticated;

alter table public.businesses
  add column if not exists business_contact_email_verified_at timestamptz;

create or replace function public.normalize_business_contact_email(input_email text)
returns text
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select nullif(lower(btrim(input_email)), '');
$$;

revoke all on function public.normalize_business_contact_email(text) from public, anon, authenticated;
grant execute on function public.normalize_business_contact_email(text) to service_role;

create or replace function public.reset_business_contact_email_verification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if public.normalize_business_contact_email(new.business_contact_email)
       is distinct from public.normalize_business_contact_email(old.business_contact_email) then
    new.business_contact_email_verified_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.reset_business_contact_email_verification() from public, anon, authenticated;

create trigger businesses_reset_contact_email_verification
before update of business_contact_email on public.businesses
for each row execute function public.reset_business_contact_email_verification();

create table public.business_email_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  normalized_email text not null,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint business_email_challenge_normalized_email_check check (
    normalized_email = public.normalize_business_contact_email(normalized_email)
    and normalized_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint business_email_challenge_token_hash_check check (octet_length(token_hash) = 32),
  constraint business_email_challenge_expiry_check check (expires_at > created_at),
  constraint business_email_challenge_consumed_check check (consumed_at is null or consumed_at >= created_at)
);

create index business_email_challenges_business_email_idx
  on public.business_email_verification_challenges (business_id, normalized_email, created_at desc);

alter table public.business_email_verification_challenges enable row level security;

revoke all on public.business_email_verification_challenges from public, anon, authenticated;
grant select, insert, update, delete on public.business_email_verification_challenges to service_role;

-- Trusted server-only consumption primitive. The row lock serializes competing
-- requests so only one transaction can consume a challenge successfully.
create or replace function public.consume_business_email_verification_challenge(
  target_business_id uuid,
  supplied_token_hash bytea
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  challenge public.business_email_verification_challenges%rowtype;
  current_normalized_email text;
  verified_at timestamptz := clock_timestamp();
begin
  if supplied_token_hash is null or octet_length(supplied_token_hash) <> 32 then
    raise exception 'invalid verification challenge';
  end if;

  select *
  into challenge
  from public.business_email_verification_challenges
  where token_hash = supplied_token_hash
  for update;

  if not found or challenge.business_id <> target_business_id then
    raise exception 'invalid verification challenge';
  end if;
  if challenge.consumed_at is not null then
    raise exception 'verification challenge already consumed';
  end if;
  if challenge.expires_at <= now() then
    raise exception 'verification challenge expired';
  end if;

  select public.normalize_business_contact_email(business_contact_email)
  into current_normalized_email
  from public.businesses
  where id = target_business_id
  for update;

  if not found or current_normalized_email is null
     or current_normalized_email <> challenge.normalized_email then
    raise exception 'business contact email no longer matches verification challenge';
  end if;

  update public.business_email_verification_challenges
  set consumed_at = verified_at
  where id = challenge.id;

  update public.businesses
  set business_contact_email_verified_at = verified_at
  where id = target_business_id;

  return verified_at;
end;
$$;

revoke all on function public.consume_business_email_verification_challenge(uuid, bytea)
  from public, anon, authenticated;
grant execute on function public.consume_business_email_verification_challenge(uuid, bytea)
  to service_role;

create or replace function public.admin_verify_business_contact_email(target_business_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  normalized_email text;
  verified_at timestamptz := clock_timestamp();
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select public.normalize_business_contact_email(business_contact_email)
  into normalized_email
  from public.businesses
  where id = target_business_id
  for update;

  if not found then
    raise exception 'business not found';
  end if;
  if normalized_email is null then
    raise exception 'business contact email required';
  end if;

  update public.businesses
  set business_contact_email_verified_at = verified_at
  where id = target_business_id;

  return verified_at;
end;
$$;

revoke all on function public.admin_verify_business_contact_email(uuid) from public, anon;
grant execute on function public.admin_verify_business_contact_email(uuid) to authenticated;

-- Keep the pre-existing structural checks separate from the new submission
-- email gate. Published legacy rows are not falsely marked verified and remain
-- editable, while every future pending/published transition requires verified
-- contact email.
create or replace function public.assert_business_structurally_publishable(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  business_record public.businesses%rowtype;
begin
  select * into business_record from public.businesses where id = target_business_id;
  if not found then raise exception 'business not found'; end if;
  if not exists (select 1 from public.categories where id = business_record.primary_category_id and active) then
    raise exception 'an active primary category is required';
  end if;
  if business_record.location_mode in ('storefront', 'hybrid')
     and (business_record.address_line_1 is null or business_record.locality is null
       or business_record.city is null or business_record.state is null
       or business_record.country is null or business_record.postal_code is null
       or not business_record.show_street_address or business_record.geo_point is null) then
    raise exception 'storefront publication requires a public address, locality, city, state, country, postal code, and map point';
  end if;
  if business_record.location_mode in ('service_area', 'hybrid')
     and not exists (select 1 from public.business_service_areas where business_id = business_record.id) then
    raise exception 'service-area publication requires at least one named service area';
  end if;
end;
$$;

revoke all on function public.assert_business_structurally_publishable(uuid) from public, anon, authenticated;

create or replace function public.assert_business_publishable(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  normalized_email text;
  email_verified_at timestamptz;
begin
  perform public.assert_business_structurally_publishable(target_business_id);

  select public.normalize_business_contact_email(business_contact_email),
         business_contact_email_verified_at
  into normalized_email, email_verified_at
  from public.businesses
  where id = target_business_id;

  if normalized_email is null then
    raise exception 'verified business contact email required for submission';
  end if;
  if email_verified_at is null then
    raise exception 'business contact email must be verified before submission';
  end if;
end;
$$;

revoke all on function public.assert_business_publishable(uuid) from public, anon, authenticated;

create or replace function public.enforce_published_business_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_business_id uuid;
begin
  if tg_table_name = 'businesses' then
    target_business_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    target_business_id := case when tg_op = 'DELETE' then old.business_id else new.business_id end;
  end if;
  if exists (
    select 1 from public.businesses
    where id = target_business_id and publication_status = 'published'
  ) then
    perform public.assert_business_structurally_publishable(target_business_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.enforce_published_business_integrity() from public, anon, authenticated;

-- The original authenticated update grant is column-scoped, so the new
-- verification timestamp is not directly writable. Keep that denial explicit.
revoke update (business_contact_email_verified_at) on public.businesses from authenticated;
