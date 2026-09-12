# Feature — Authentication

## MVP

- register
- login
- logout
- password recovery if password auth is enabled
- protected owner dashboard
- profile record
- role-aware navigation

## Preferred backend

Supabase Auth.

## Credential decision

The first credential flow will be email/password or magic link. Select one with the Phase 2 onboarding specification; social login is not required for MVP.

## Initial roles

- `admin`
- `business_owner`
- `user`

Roles must come from trusted database/server state.

## Later

- magic link
- OTP
- Google login
- team/business staff access

Business ownership and role checks must be derived from trusted server/database state. Future business-member relationships must support ownership separately from a public listing, so claim and admin-created listing flows remain possible.
