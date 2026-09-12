# Phase 2 — MVP Specification Lock

**Status:** Ready to begin  
**Coding:** Not permitted yet

## Goal

Turn Phase 1 decisions into implementation-ready product, database, security, route, and onboarding specifications.

## Workstream 1 — Business field matrix

Lock every field as:

```text
required
optional
internal-only
public
normalized
verified
```

Cover:

- identity
- NAP
- website/contact
- category
- services
- business hours
- social links
- images
- storefront/service-area fields
- coordinates
- metadata/provenance

Output:

```text
docs/specs/BUSINESS_FIELD_MATRIX.md
```

## Workstream 2 — User journeys

Lock:

### Buzl client onboarding

```text
auth
→ create business
→ identity/NAP
→ category/services
→ location
→ preview
→ publish/submit
```

### Existing listing management

- edit
- slug-changing rules
- address move
- publication state
- verification state

### External signup

Decide whether external user registration ships in MVP or is feature-gated.

Output:

```text
docs/specs/USER_JOURNEYS.md
```

## Workstream 3 — Final database schema

Lock:

- tables
- column types
- nullability
- enums/checks
- foreign keys
- unique rules
- indexes
- FTS/search vector
- PostGIS point
- slug history
- service areas
- external IDs
- ownership/membership
- audit/history minimums

Output:

```text
docs/specs/DATABASE_SCHEMA.md
```

No migration code yet.

## Workstream 4 — Security / RLS matrix

Define per role + table:

```text
select
insert
update
delete
```

Cover:

- anonymous public
- authenticated user
- business manager/owner
- admin

Output:

```text
docs/specs/RLS_MATRIX.md
```

## Workstream 5 — Duplicate / claim / verification rules

Lock:

- duplicate strong identifiers
- fuzzy thresholds/behavior
- block vs warn vs review
- claim-business boundary
- verification requirement
- verified badge policy

Output:

```text
docs/specs/VERIFICATION_DUPLICATES.md
```

## Workstream 6 — Category / service / location model

Lock:

- initial category source/seed
- category hierarchy depth
- primary/secondary category behavior
- service representation
- tag governance
- location seed/source
- service-area representation

Output:

```text
docs/specs/TAXONOMY_LOCATIONS.md
```

## Workstream 7 — Routes & SEO matrix

Lock exact public paths and indexability.

Include:

- listing
- category
- location
- category+location
- pagination
- internal search
- filter URLs
- slug redirects
- sitemap membership

Output:

```text
docs/specs/ROUTES_SEO_MATRIX.md
```

## Workstream 8 — Map/geocoder selection

Test shortlist using representative Indian addresses.

Compare:

- exact address accuracy
- locality/PIN handling
- autocomplete quality
- reverse geocoding
- permanent coordinate/result storage terms
- map-load cost
- monthly geocode cost
- attribution
- DX

Lock one primary provider and optionally one fallback.

Output:

```text
docs/specs/MAPS_PROVIDER.md
```

## Workstream 9 — Authentication UX

Choose:

- email + password, or
- magic link

Specify:

- registration
- login
- recovery
- email verification
- session UX

Output:

```text
docs/specs/AUTH_FLOW.md
```

## Workstream 10 — Public listing IA

Lock sections/order:

- breadcrumbs
- header
- category/status/verification
- primary contact CTAs
- NAP
- map
- hours
- services
- about
- socials
- related businesses

Output:

```text
docs/specs/PUBLIC_LISTING_IA.md
```

## Phase 2 exit criteria

All must be true:

- [ ] business field matrix complete
- [ ] user journeys complete
- [ ] final conceptual DB schema complete
- [ ] RLS matrix complete
- [ ] duplicate/verification rules complete
- [ ] taxonomy/location rules complete
- [ ] routes/SEO matrix complete
- [ ] map provider selected
- [ ] auth UX selected
- [ ] public listing IA complete
- [ ] remaining architecture decisions recorded
- [ ] `CURRENT_STATE.md` says Phase 3 is authorized

Only then may Codex scaffold the Next.js/Supabase application.
