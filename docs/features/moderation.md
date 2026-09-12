# Feature — Moderation, Verification & Duplicates

**Status:** Phase 1 architecture locked; Phase 2 policy/threshold details pending.

## Publication status

```text
draft
pending
published
rejected
suspended
archived
```

## Verification status

```text
unverified
pending
verified
failed
```

Publication and verification are independent.

## Internal/Buzl launch

Buzl-created or trusted client listings may use a faster publishing path.

The exact MVP fast-path policy is a Phase 2 decision.

## External registration

When public external registration is enabled, the recommended direction is:

```text
draft
  ↓
submit
  ↓
pending
  ↓
duplicate/security/content checks
  ↓
published or rejected
```

## Duplicate detection

Use layered signals.

Strong:

- normalized phone
- normalized website domain
- legitimate external provider ID
- internal Buzl business/client ID

Context/fuzzy:

- normalized name
- address
- postal code
- city
- geographic proximity
- trigram similarity

Do not auto-merge uncertain fuzzy matches.

## Claiming

Future architecture should permit:

```text
existing listing
  ↓
claim request
  ↓
verification
  ↓
business membership/management granted
```

The public business record should not require an owner account to exist from day one.

## Verification methods

Potential future methods:

- phone OTP
- email/domain verification
- website ownership
- Buzl client verification
- manual admin evidence

Phase 2 decides what, if any, verification method is required for MVP.
