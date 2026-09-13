-- User-management/RBAC foundation. Roles remain trusted Auth app_metadata;
-- profiles hold account lifecycle and the non-admin member permission preset.
create type public.account_status as enum ('invited', 'active', 'inactive', 'suspended');
create type public.permission_preset as enum ('onboarding_member', 'listing_manager');

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists permission_preset public.permission_preset;

update public.profiles set account_status = 'active' where account_status is null;

create or replace function public.is_account_active()
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active'); $$;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = pg_catalog, public
as $$ select public.is_account_active() and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); $$;

create or replace function public.is_buzl_member()
returns boolean language sql stable security invoker set search_path = pg_catalog, public
as $$ select public.is_account_active() and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'buzl_member'), false); $$;

create or replace function public.has_permission(permission_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$
  select case
    when not public.is_account_active() then false
    when (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' then true
    when (auth.jwt() -> 'app_metadata' ->> 'role') = 'business_owner' then permission_name in ('listing.view', 'listing.create', 'listing.edit', 'listing.submit')
    when (auth.jwt() -> 'app_metadata' ->> 'role') = 'buzl_member' then
      permission_name in ('listing.view', 'listing.create', 'listing.edit', 'listing.import', 'listing.submit')
      or ((select permission_preset from public.profiles where id = auth.uid()) = 'listing_manager' and permission_name in ('listing.publish', 'listing.suspend'))
    else false end;
$$;

create or replace function public.is_business_manager(target_business_id uuid)
returns boolean language sql stable security invoker set search_path = pg_catalog, public
as $$ select public.is_account_active() and exists (select 1 from public.business_managers manager where manager.business_id = target_business_id and manager.user_id = auth.uid()); $$;

create or replace function public.transition_business_publication(target_business_id uuid, next_status public.publication_status)
returns void language plpgsql security definer set search_path = pg_catalog, public
as $$
declare current_status public.publication_status;
begin
  if auth.uid() is null or not public.is_account_active() then raise exception 'active account required'; end if;
  select publication_status into current_status from public.businesses where id = target_business_id for update;
  if not found then raise exception 'business not found'; end if;
  if next_status = 'published' and public.has_permission('listing.publish') then null;
  elsif next_status = 'suspended' and public.has_permission('listing.suspend') then null;
  elsif next_status = 'pending' and public.is_business_manager(target_business_id) and current_status = 'draft' and public.has_permission('listing.submit') then null;
  else raise exception 'not authorized for this publication transition'; end if;
  if next_status in ('pending', 'published') then perform public.assert_business_publishable(target_business_id); end if;
  update public.businesses set publication_status = next_status where id = target_business_id;
end;
$$;

create or replace function public.set_business_verification(target_business_id uuid, next_status public.verification_status)
returns void language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin() then raise exception 'admin role required'; end if;
  update public.businesses set verification_status = next_status where id = target_business_id;
  if not found then raise exception 'business not found'; end if;
end;
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.is_account_active(), public.has_permission(text) to authenticated;
