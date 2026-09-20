# Buzl Listing Authentication Architecture V2

**Status:** APPROVED
**Decision date:** 2026-09-20
**Implementation status:** Independent review passed. Phase 1 database-foundation implementation is authorized; UI, staging, production, and OTP activity remain outside this approval.

## 1. Locked product decision

WhatsApp OTP is the default public signup and login method for Business Owners.

```text
Unknown WhatsApp phone
  -> Supabase sends OTP through the signed Send SMS Hook
  -> Meta delivers the approved WhatsApp authentication template
  -> Supabase verifies OTP
  -> Supabase creates one Auth user
  -> database trigger creates one active application profile
  -> trusted app_metadata role defaults to business_owner
  -> application routes to onboarding

Existing WhatsApp phone
  -> same Supabase OTP flow
  -> existing Auth user and UID
  -> same profile, role, permissions, and owned businesses
  -> application routes to dashboard or unfinished onboarding
```

The public client must never create or select `admin`, `buzl_member`, the `listing_manager` permission preset, or another privileged identity. Admins and Buzl Members remain invited or admin-created and explicitly authorized.

Supabase Auth remains the OTP, identity, verification, and session authority. Meta is delivery only through the existing signed Send SMS Hook. There is no custom OTP generator, custom JWT, or custom session.

## 2. Identity and domain boundaries

| Concern | Authority | Rules |
|---|---|---|
| Authentication phone | `auth.users.phone` / Supabase Auth | Private login credential. Never copied automatically into listing data. |
| Optional Auth email | `auth.users.email` / Supabase Auth | Private optional login credential attached to the same UID. |
| Optional password | Supabase Auth | Added later from Account -> Security; not required for WhatsApp signup. |
| Application profile | `public.profiles`, keyed by Auth UID | Account lifecycle and non-admin member permission preset. |
| Role | trusted Auth `app_metadata.role` | Public signup defaults only to `business_owner`; never trust `user_metadata` for authorization. |
| Business contact phone/email | `public.businesses` | Listing data. Explicit user input only; never inferred from Auth credentials. |
| Ownership | `public.business_managers` | One user may own/manage zero or many businesses. |
| Listing publication | `public.businesses.publication_status` | Separate from account status and verification. |
| Listing verification | `public.businesses.verification_status` | Separate moderation signal; not an Auth credential. |

### State separation

- Account status: `invited`, `active`, `inactive`, `suspended`.
- Listing publication: `draft`, `pending`, `published`, `rejected`, `suspended`, `archived`.
- Listing verification: `unverified`, `pending`, `verified`, `failed`.

Creating an active Business Owner account does not create or publish a business. Owners may create/edit drafts and submit eligible listings. Only an admin or a Buzl Member with the `listing_manager` permission preset may publish or suspend according to existing RBAC.

## 3. Current implementation audit

### Supabase phone signup configuration

`supabase/config.toml` currently sets:

- `auth.sms.enable_signup = true`
- `auth.sms.enable_confirmations = true`
- the signed `auth.hook.send_sms` endpoint
- local OTP send and verification rate-limit values

`auth.sms.enable_signup = true` is the correct direction for this approved model because an unknown verified phone is intentionally allowed to create a new Auth user. The deployed/staging value must remain gated until the V2 UI, profile-routing logic, CAPTCHA, throttling, and tests have passed review.

The public entry point should call the supported Supabase phone OTP flow with creation explicitly enabled. The same flow serves sign-in and signup; it must not preflight whether a phone exists because that would create an account-enumeration side channel.

### Profile and role provisioning

The `public.handle_new_user()` trigger currently:

1. runs after insertion into `auth.users`;
2. writes `business_owner` to trusted `raw_app_meta_data.role` only when no role is already present;
3. inserts a `public.profiles` row with `account_status = active`;
4. preserves an explicitly authorized role already set by an admin-created flow.

This is the correct least-privilege server/database boundary for public signup. Public metadata must not be accepted as role input. Implementation tests must prove that a client-supplied `role`, `permission_preset`, or equivalent user metadata cannot promote a user.

### Ownership and moderation

- `public.business_managers` uses `(business_id, user_id)` as its primary key and has no one-business-per-user constraint. One user to many businesses is already supported.
- `create_business_for_current_user` requires an authenticated active account and creates the owner assignment.
- `transition_business_publication` allows an owner to move only an owned draft to pending and allows publishing/suspension only to authorized internal roles.
- `set_business_verification` is admin-only.

No ownership or moderation redesign is required for Auth V2.

### Business contact data

`public.businesses.business_contact_email` already exists and is independent of `auth.users.email`. Business phone fields are also separate from `auth.users.phone`. Current form actions do not automatically copy Auth credentials into listing fields. Preserve that boundary.

## 4. Single WhatsApp entry point and routing

The preferred UI is one **Continue with WhatsApp** action on the public Auth surface:

1. Normalize and validate the entered phone as E.164.
2. Obtain a valid CAPTCHA token when protection is enabled.
3. Call Supabase `signInWithOtp({ phone, options: { shouldCreateUser: true, captchaToken } })`.
4. Show the same non-enumerating response whether the phone is new or existing.
5. Accept the OTP and call `verifyOtp({ phone, token, type: 'sms' })`.
6. Use the returned session/UID; never create a parallel application identity.
7. Read the trusted profile and route by explicit onboarding state.

Do not infer “new user” from phone lookup, `created_at`, business count, or client metadata. Add `profiles.onboarding_completed_at timestamptz null` and use it as the routing authority:

- `null` -> `/onboarding`
- non-null -> `/dashboard`

The migration must backfill existing users whose onboarding is already complete, using an explicitly reviewed deterministic rule. Newly provisioned public owners remain null until the onboarding completion action succeeds.

## 5. Mandatory business-email verification

### Decision

Business contact email is listing data, not an Auth identity. A draft may be saved with an unverified business email, but a listing cannot be submitted for review until its current business contact email is verified.

Use a dedicated server-side secure email-link flow rather than Supabase Auth email OTP. Reusing Auth email verification would incorrectly attach a public listing field to the user's private login identity.

### Migration

Add:

```sql
alter table public.businesses
  add column business_contact_email_verified_at timestamptz;
```

Do not add a redundant verification-status enum. Verified state is derived from `business_contact_email_verified_at is not null` for the current email.

Add a private table conceptually named `business_email_verification_challenges`:

| Column | Purpose |
|---|---|
| `id uuid` | Challenge identifier. |
| `business_id uuid` | Business being verified. |
| `normalized_email text` | Exact normalized email the challenge covers. |
| `token_hash text` | Hash of a high-entropy, single-use token; never store the raw token. |
| `expires_at timestamptz` | Short expiry. |
| `consumed_at timestamptz` | Single-use enforcement. |
| `requested_by uuid` | Auth UID that requested verification. |
| `created_at timestamptz` | Audit timestamp. |

The table must not be client-readable. A server-only action creates the challenge and sends the raw link through the approved transactional email provider. The verification endpoint hashes the supplied token, locks the challenge, confirms it is unused/unexpired, confirms the authenticated/authorized owner where required, and confirms `normalized_email` still matches the business's current normalized contact email before setting `business_contact_email_verified_at`.

A database trigger must clear `business_contact_email_verified_at` whenever the normalized business contact email changes. `assert_business_publishable()` must require a non-empty business contact email and a non-null verification timestamp before `draft -> pending` or publication. This database check is authoritative; UI validation is supplementary.

## 6. Optional same-account Auth credentials

### Optional Auth email

From an authenticated account-security screen, call Supabase `updateUser({ email })` and complete the configured email-change confirmation. This modifies the existing Auth user and preserves the same Supabase UID, profile, role, ownership, and permissions.

Requirements:

- require a recent/re-authenticated session for this sensitive operation;
- fail normally if the email is already owned by another Auth user;
- never auto-merge users or copy the Auth email into a business;
- route confirmations only through approved application URLs.

### Optional password

After the user is authenticated, add a password with Supabase `updateUser({ password })`. Enable secure password-change behavior and require recent authentication or Supabase's reauthentication nonce for later changes. Password remains optional; WhatsApp OTP continues to work on the same UID.

### Phone-link registry recommendation

**Remove it for normal Business Owner signup/login.** Supabase's phone identity on the Auth user is the canonical mapping, so a parallel application phone-to-user registry would duplicate identity state and introduce synchronization risk.

For internal `admin` or `buzl_member` accounts, do not expose public phone signup as a route to privilege. If an internal account later needs phone login, add it only from an already authenticated security setting or an explicit admin invitation flow, preserving the existing UID and recording an audit event. Do not auto-merge identities based on matching email or phone.

## 7. Anti-abuse and duplicate controls

Required before public rollout:

- Configure production-grade Supabase Auth SMS send, sign-in/signup, and OTP-verification rate limits.
- Retain per-phone resend cooldowns and add a server-side abuse budget beyond UI timers.
- Enable Cloudflare Turnstile or hCaptcha at the public OTP request point and pass the token to Supabase.
- Apply IP-based edge/WAF throttling without using it as the only protection.
- Return non-enumerating OTP-request responses.
- Rate-limit business creation and review submission per active user/account.
- Continue exact duplicate checks for Google Place ID and normalized domain.
- Flag, rather than auto-merge, likely duplicates by business name/location and normalized contact phone/email.
- Keep listing publication behind moderation.
- Audit repeated signup, OTP, business creation, and submission activity without recording OTP values or Auth secrets.

No fuzzy business auto-merge is approved.

## 8. Existing WhatsApp delivery infrastructure

Preserve this proven path:

```text
Supabase-generated OTP
  -> signed Send SMS Hook
  -> server-only Meta provider
  -> approved buzl_listing_otp template, language en
  -> WhatsApp recipient
```

The delivery adapter must remain unable to create identities or sessions. V2 changes only who may intentionally initiate the Supabase phone signup flow and how the application provisions/routes the resulting Auth user.

## 9. Obsolete assumptions and affected implementation

The following existing assumptions are superseded by this decision:

- `docs/specs/MVP_BUILD_CONTRACT.md` says the prototype exposes no public signup and uses email/password only.
- `docs/ROADMAP.md` leaves public signup as an unresolved decision.
- `docs/ACTIVE_TASK.md` previously said an unknown phone must not create a user/profile or receive `business_owner`.
- Login/signup UI currently presents email OTP and password as working methods while WhatsApp is a placeholder/limited staging surface.
- Existing browser tests exercise the old tab ordering and do not prove phone-first provisioning or privileged-role denial.
- Staging safety configuration previously disabled unknown-phone creation for the former architecture gate.

These files and behaviors are identified for the implementation task; this documentation-only task does not rewrite locked historical specifications or runtime code.

## 10. Required implementation changes

### Database

1. Add `profiles.onboarding_completed_at` and an explicit existing-user backfill.
2. Add `businesses.business_contact_email_verified_at`.
3. Add private, RLS-denied/server-only `business_email_verification_challenges` storage with token hashes, expiry, and single-use enforcement.
4. Clear verification when the normalized business email changes.
5. Enforce verified business email in `assert_business_publishable()`.
6. Add tests proving public users default to active `business_owner`, cannot inject privileged metadata, and cannot self-publish.

### Auth configuration

1. Keep phone signup and phone confirmation enabled for V2.
2. Keep the signed Send SMS Hook and approved Meta template/language unchanged.
3. Configure production OTP limits and CAPTCHA; local values are not release defaults.
4. Enable secure password change before optional-password rollout.
5. Update isolated staging only after architecture/implementation review; production remains untouched until a separate authorization.

### Application

1. Replace the public Auth choice with one primary **Continue with WhatsApp** flow while retaining approved fallback methods during migration.
2. Implement E.164 validation, CAPTCHA, OTP request, OTP verification, and non-enumerating errors.
3. Route after verified session using `profiles.onboarding_completed_at`.
4. Add Business Owner onboarding completion.
5. Add business-contact-email verification request/consume UI and block submit until verified.
6. Add Account -> Security controls for optional Auth email and password on the same UID.
7. Keep all role changes and internal account creation in trusted admin/server paths.

## 11. Local test artifact

A previous phone-only local test user/profile may exist. The local Supabase Docker runtime was unavailable during this audit, so the record could not be confirmed safely. No database rows were read, altered, or deleted.

Before V2 runtime testing, start only the isolated local Supabase stack and inspect the candidate using non-secret identifiers. It is safe to remove only if it is confirmed to be the unowned, unprivileged test identity with no businesses, manager assignments, or other dependent records. Until then the result is **REVIEW_REQUIRED**.

## 12. Implementation phases

1. **Independent architecture review** — approve this decision, schema plan, security boundaries, and superseded assumptions.
2. **Database and policy foundation** — migrations, server-enforced email-verification gate, onboarding marker, and pgTAP/RLS tests.
3. **Phone-first Auth UI** — single WhatsApp flow, CAPTCHA, profile resolution, onboarding routing, and privileged-role denial tests.
4. **Business email verification and optional credentials** — secure link flow, Auth email/password settings, and same-UID regression coverage.
5. **Isolated staging verification** — one controlled new-phone signup, existing-phone login, role/RBAC/account-status checks, owner moderation limits, anti-abuse checks, and no-contact-copy assertions before any production decision.

## 13. Review gate

Independent architecture review passed with identity, public-signup, role-provisioning, privilege-escalation, RLS, and migration design approved. Phase 1 must preserve existing listings without treating historical contact emails as verified. The next implementation gate is:

`AUTH_V2_PHASE_1_DB_REVIEW`
