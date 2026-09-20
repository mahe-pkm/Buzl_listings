-- Auth V2 Phase 3: transactional business-contact-email challenge issuance.
-- Plaintext tokens are generated and delivered only by the trusted app server;
-- PostgreSQL receives and stores only a 32-byte SHA-256 digest.

create or replace function public.create_business_email_verification_challenge(
  target_business_id uuid,
  supplied_token_hash bytea
)
returns table (business_name text, normalized_email text, expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  business_record public.businesses%rowtype;
  target_email text;
  issued_at timestamptz := clock_timestamp();
begin
  if auth.uid() is null or not public.is_business_manager(target_business_id) then
    raise exception 'business management authorization required';
  end if;
  if supplied_token_hash is null or octet_length(supplied_token_hash) <> 32 then
    raise exception 'invalid verification challenge';
  end if;

  select * into business_record
  from public.businesses
  where id = target_business_id
  for update;

  if not found then raise exception 'business not found'; end if;
  target_email := public.normalize_business_contact_email(business_record.business_contact_email);
  if target_email is null then raise exception 'business contact email required'; end if;

  if exists (
    select 1 from public.business_email_verification_challenges challenge
    where challenge.business_id = target_business_id
      and challenge.normalized_email = target_email
      and challenge.consumed_at is null
      and challenge.created_at > issued_at - interval '60 seconds'
  ) then
    raise exception 'verification email was requested recently';
  end if;

  -- Replacing an active challenge is serialized by the locked business row.
  update public.business_email_verification_challenges
  set consumed_at = issued_at
  where business_id = target_business_id and consumed_at is null;

  expires_at := issued_at + interval '30 minutes';
  insert into public.business_email_verification_challenges (
    business_id, normalized_email, token_hash, expires_at, created_at
  ) values (
    target_business_id, target_email, supplied_token_hash, expires_at, issued_at
  );

  business_name := business_record.canonical_name;
  normalized_email := target_email;
  return next;
end;
$$;

revoke all on function public.create_business_email_verification_challenge(uuid, bytea)
  from public, anon;
grant execute on function public.create_business_email_verification_challenge(uuid, bytea)
  to authenticated;

-- The public URL carries only an opaque token. This service-role-only wrapper
-- resolves its business inside the same transaction before delegating to the
-- existing row-locking consumption primitive.
create or replace function public.consume_business_email_verification_token(
  supplied_token_hash bytea
)
returns table (business_id uuid, verified_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_business_id uuid;
begin
  if supplied_token_hash is null or octet_length(supplied_token_hash) <> 32 then
    raise exception 'invalid verification challenge';
  end if;

  select challenge.business_id into target_business_id
  from public.business_email_verification_challenges challenge
  where challenge.token_hash = supplied_token_hash;

  if not found then raise exception 'invalid verification challenge'; end if;

  business_id := target_business_id;
  verified_at := public.consume_business_email_verification_challenge(
    target_business_id,
    supplied_token_hash
  );
  return next;
end;
$$;

revoke all on function public.consume_business_email_verification_token(bytea)
  from public, anon, authenticated;
grant execute on function public.consume_business_email_verification_token(bytea)
  to service_role;

create or replace function public.resolve_business_email_verification_challenge(
  supplied_token_hash bytea
)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select business_id
  from public.business_email_verification_challenges
  where token_hash = supplied_token_hash;
$$;

revoke all on function public.resolve_business_email_verification_challenge(bytea)
  from public, anon, authenticated;
grant execute on function public.resolve_business_email_verification_challenge(bytea)
  to service_role;

-- If SMTP delivery fails, remove only the just-created unusable challenge.
create or replace function public.discard_business_email_verification_challenge(
  supplied_token_hash bytea
)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  delete from public.business_email_verification_challenges
  where token_hash = supplied_token_hash and consumed_at is null;
$$;

revoke all on function public.discard_business_email_verification_challenge(bytea)
  from public, anon, authenticated;
grant execute on function public.discard_business_email_verification_challenge(bytea)
  to service_role;
