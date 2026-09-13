-- User-management/RBAC foundation. Roles remain trusted Auth app_metadata;
-- profiles hold account lifecycle and the non-admin member permission preset.
create type public.account_status as enum ('invited', 'active', 'inactive', 'suspended');
create type public.permission_preset as enum ('onboarding_member', 'listing_manager');

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists permission_preset public.permission_preset;

update public.profiles set account_status = 'active' where account_status is null;

-- Public Auth signup cannot set app_metadata. Assign the least-privileged role
-- in the trusted database trigger; admin-created users already carry a role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if nullif(new.raw_app_meta_data ->> 'role', '') is null then
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'business_owner') where id = new.id;
  end if;
  insert into public.profiles (id, full_name, account_status)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'full_name', 120), ''), 'active'::public.account_status)
  on conflict (id) do nothing;
  return new;
end;
$$;

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

-- The original Day 1 creation RPC predates account lifecycle status. Replacing
-- it here keeps the same validated input contract while denying direct RPC
-- calls from inactive or suspended sessions, even if their JWT still exists.
create or replace function public.create_business_for_current_user(
  p_canonical_name text, p_primary_phone text, p_primary_category_id uuid, p_location_mode public.location_mode,
  p_city text, p_state text, p_country text, p_country_code char(2) default 'IN',
  p_address_line_1 text default null, p_address_line_2 text default null, p_locality text default null,
  p_postal_code text default null, p_show_street_address boolean default false,
  p_latitude numeric default null, p_longitude numeric default null
) returns uuid language plpgsql security definer set search_path = pg_catalog, public
as $$
declare new_business_id uuid;
begin
  if auth.uid() is null or not public.is_account_active() then raise exception 'active account required'; end if;
  if not exists (select 1 from public.categories where id = p_primary_category_id and active) then raise exception 'primary category must be active'; end if;
  if (p_latitude is null) <> (p_longitude is null) or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'a valid latitude and longitude pair is required when a map point is supplied'; end if;
  insert into public.businesses (canonical_name, slug, primary_phone, primary_phone_normalized, primary_category_id, location_mode, city, state, country, country_code, address_line_1, address_line_2, locality, postal_code, show_street_address, geo_point, created_by)
  values (p_canonical_name, 'pending-derived-slug', p_primary_phone, '0000000', p_primary_category_id, p_location_mode, p_city, p_state, p_country, upper(p_country_code), p_address_line_1, p_address_line_2, p_locality, p_postal_code, p_show_street_address, case when p_latitude is null then null else extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography end, auth.uid())
  returning id into new_business_id;
  insert into public.business_managers (business_id, user_id, role) values (new_business_id, auth.uid(), 'owner');
  return new_business_id;
end;
$$;

-- Listing Managers need a review queue, while onboarding members remain
-- limited to import/submit. RLS exposes only rows they can moderate.
drop policy if exists businesses_select_listing_moderator on public.businesses;
create policy businesses_select_listing_moderator on public.businesses for select
  using (public.has_permission('listing.publish'));

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
