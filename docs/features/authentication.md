# Feature — Authentication

**Status:** Phase 1 direction locked; Phase 2 UX details pending.

## Approved backend

Supabase Auth.

## Initial roles

Conceptually:

```text
admin
business_owner
user
```

The exact role/membership implementation must be locked with RLS in Phase 2.

## MVP auth method

Deferred to Phase 2:

- email + password, or
- magic link

Social login is not required for MVP.

## Security rules

- roles must come from trusted server/database state
- never trust a client-supplied role
- protected business actions must verify membership/ownership
- UI route protection does not replace server/database authorization

## Future

Potential additions:

- OTP
- Google sign-in
- business team members
- claim-business verification
