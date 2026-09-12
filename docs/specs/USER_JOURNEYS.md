# Buzl Listing — MVP User Journeys

**Status:** DRAFT / REVIEW — Phase 2.2

## Purpose and boundary

This document defines product journeys before database/schema or UI implementation. It is implementation-neutral: it does not define components, tables, SQL, API routes, RLS syntax, packages, or a map vendor. It uses the Phase 2.1 Business Field Matrix as the authoritative field contract.

## Cross-journey product rules

- One listing represents one storefront, service-area, or hybrid business presence.
- Publication and verification are independent. Trusted Buzl admin/client listings may publish while unverified.
- MVP uses exactly one active primary category; owner-defined service names are allowed and remain separate from categories. Tags are excluded.
- Logo and cover are optional; gallery and service radius are future work.
- Business contact email is separate from private account/login email and is hidden unless the owner explicitly makes it public.
- India-first UX retains country and country code for global extensibility.
- Pure service-area businesses require no public or private street address; private coordinates must never appear in public HTML, JSON-LD, public APIs, maps, or metadata.
- External self-service publishing is feature-gated and disabled at initial launch.
- The canonical listing URL is stable; an approved slug change requires a historical-slug redirect.
- Public discovery exposes only eligible published listings. Arbitrary faceted/search URLs are not automatically indexable.

## Conceptual onboarding model

1. **Business Identity** — canonical name and location mode.
2. **Contact / NAP** — primary phone and relevant public location data.
3. **Primary Category + Services** — one active category and optional owner-defined services.
4. **Location Mode + Address / Service Areas** — requirements vary by storefront, service-area, or hybrid mode.
5. **Optional Profile Details** — enrichment never blocks a minimum publishable listing.
6. **Preview** — public-safe representation only.
7. **Submit / Publish** — publication state is considered separately from verification state.

## Journey template

Every journey below states: actor, goal, entry point, preconditions, required data, steps, validation, private-data treatment, publication impact, verification impact, SEO/indexability impact, success and edge states, future considerations, and decision status.

## Admin and owner journeys

### J01 — Buzl Admin creates a business listing

- **Actor / goal / entry:** Buzl Admin; create an accurate listing; authenticated administration context.
- **Preconditions / required data:** Authorized admin; canonical identity, primary phone, one primary category, location mode, and mode-specific minimum record.
- **Steps:** Enter identity and canonical NAP; select primary category; set location mode; provide storefront address/map location or named service areas; optionally enrich; preview; decide publication.
- **Validation / private rules:** Enforce the Phase 2.1 minimum record. No fake service-area address; private coordinates remain private.
- **Publication / verification / SEO:** Trusted Buzl-created listing may publish unverified; only published public-safe data can be indexed.
- **Success / edge / future:** Listing is draft, submitted, or published according to the decision; suspected duplicates are flagged for review. Future manager assignment does not alter the listing identity.
- **Decision status:** LOCKED.

### J02 — Buzl Client signs in

- **Actor / goal / entry:** Buzl Client/Business Owner; access the dashboard; login entry.
- **Preconditions / required data:** Registered account; email and password.
- **Steps:** Submit credentials; on success enter the dashboard; use the recovery path for forgotten password.
- **Validation / private rules:** Invalid credentials do not reveal account details; login email remains private and is never treated as public business email.
- **Publication / verification / SEO:** None; authenticated surfaces are not public/indexable.
- **Success / edge / future:** Successful dashboard entry; invalid credentials or reset flow are handled without creating a listing. Magic link/social authentication are future.
- **Decision status:** LOCKED.

### J03 — Buzl Client creates a business listing

- **Actor / goal / entry:** Buzl Client/Business Owner; create a listing; authenticated dashboard.
- **Preconditions / required data:** Signed in; Phase 2.1 minimum publishable requirements.
- **Steps:** Account → identity + NAP → category + optional services → location → optional details → preview → submit/publish.
- **Validation / private rules:** One primary category; mode-specific validation; business contact email is distinct and hidden by default.
- **Publication / verification / SEO:** Trusted client listing may publish unverified; only public canonical data is eligible for SEO.
- **Success / edge / future:** Draft, submitted, or published listing; duplicate suspicion is routed to review, never fuzzy auto-merge. Future shared managers remain possible.
- **Decision status:** LOCKED.

### J04 — Storefront business onboarding

- **Actor / goal / entry:** Admin or authenticated owner; create a storefront listing; create/onboarding flow.
- **Preconditions / required data:** Canonical name, primary phone, primary category, `storefront` mode, public structured address, locality/city, state, country, PIN where applicable, and public map location.
- **Steps:** Supply the required storefront data; optionally enrich; preview; submit/publish.
- **Validation / private rules:** Address is public and map location is public; invalid/missing required data blocks publish.
- **Publication / verification / SEO:** Normal publication decision; verification remains independent; public address/map may inform canonical public output.
- **Success / edge / future:** A publishable storefront record; hidden-address conflict blocks this mode until resolved. Provider choice is future.
- **Decision status:** LOCKED.

### J05 — Service-area business onboarding

- **Actor / goal / entry:** Admin or authenticated owner; create a service-area listing; create/onboarding flow.
- **Preconditions / required data:** Canonical name, primary phone, primary category, `service_area` mode, city, state, country, and at least one named service area.
- **Steps:** Supply coverage locations; optionally enrich; preview the public coverage representation; submit/publish.
- **Validation / private rules:** Do not require a storefront address, private street address, or radius. Exact private coordinates never leak.
- **Publication / verification / SEO:** Publication remains independent of verification; public output uses approved service areas, never a fabricated address.
- **Success / edge / future:** Publishable service-area listing; missing named service area blocks publish. Radius is future.
- **Decision status:** LOCKED.

### J06 — Hybrid business onboarding

- **Actor / goal / entry:** Admin or authenticated owner; create a hybrid listing; create/onboarding flow.
- **Preconditions / required data:** All storefront requirements plus at least one named service area.
- **Steps:** Complete both location contexts; preview public address/map and coverage; submit/publish.
- **Validation / private rules:** Storefront address/map must be public; no private coordinate leakage.
- **Publication / verification / SEO:** Same independent states; public output may include both approved storefront and service-area context.
- **Success / edge / future:** Publishable hybrid listing; absence of either required context blocks publish. Radius remains future.
- **Decision status:** LOCKED.

### J07 — Edit existing listing

- **Actor / goal / entry:** Authorized admin or owner; maintain an existing listing; listing-management context.
- **Preconditions / required data:** Authorized relationship; changed values must meet the current field contract.
- **Steps:** Edit permitted identity, NAP, category, service, location, enrichment, or visibility data; preview material public changes; submit the change as applicable.
- **Validation / private rules:** Canonical NAP remains controlled; one primary category remains required; location-mode changes revalidate mode-specific minimum data.
- **Publication / verification / SEO:** Publication and verification remain separate. Approved slug changes require redirect handling; public data changes update public/SEO-derived output conceptually.
- **Success / edge / future:** Valid edited record; unauthorized edit is denied; suspected duplicate is reviewed. Exact re-review triggers remain future policy and do not alter the locked journey boundary.
- **Decision status:** LOCKED.

### J08 — Business preview before publication

- **Actor / goal / entry:** Admin or owner; inspect public representation; onboarding or edit flow.
- **Preconditions / required data:** Draft data sufficient to render available public fields.
- **Steps:** Review public listing information, canonical NAP, category/services, location, hours, contact actions, and available media; correct data before submit/publish.
- **Validation / private rules:** Private addresses, coordinates, account email, and internal states do not appear.
- **Publication / verification / SEO:** Preview does not publish or index; verification status is not conflated with publication.
- **Success / edge / future:** Accurate public-safe preview; missing publish requirements are identified. Exact UI composition is future implementation work.
- **Decision status:** LOCKED.

### J09 — Trusted Buzl listing publication

- **Actor / goal / entry:** Buzl Admin or Buzl Client/Member; publish a trusted-source listing; completed preview/submission.
- **Preconditions / required data:** Minimum publishable record and trusted source.
- **Steps:** Confirm the publication decision and make eligible public data available.
- **Validation / private rules:** Validate required mode data and public-safe rendering; protect private data.
- **Publication / verification / SEO:** A listing may be published with `verification_status = unverified`; published canonical listings become eligible for public/indexable output.
- **Success / edge / future:** Published or retained in an appropriate non-public state; verification method/badge policy is future.
- **Decision status:** LOCKED.

### J15 — Listing rejected

- **Actor / goal / entry:** Admin and affected owner; handle rejection; publication review outcome.
- **Preconditions / required data:** Listing is in a reviewable publication state; rejection reason is retained as internal audit data.
- **Steps:** Change publication status to rejected; provide correction/resubmission context according to later policy.
- **Validation / private rules:** Do not expose sensitive internal evidence by default.
- **Publication / verification / SEO:** Rejected listings are not public/indexable; rejection is not a verification failure.
- **Success / edge / future:** Owner can correct/resubmit conceptually; exact owner-facing reason policy is future.
- **Decision status:** LOCKED.

### J16 — Listing suspended

- **Actor / goal / entry:** Buzl Admin; suspend a listing; moderation context.
- **Preconditions / required data:** Authorized administrative action and publication lifecycle context.
- **Steps:** Set the publication state to suspended and retain the administrative audit context.
- **Validation / private rules:** Do not disclose sensitive internal reasons by default.
- **Publication / verification / SEO:** Suspended listing is not public/indexable; verification state remains separate.
- **Success / edge / future:** Public access is withdrawn conceptually; owner visibility details are later policy.
- **Decision status:** LOCKED.

### J17 — Listing archived

- **Actor / goal / entry:** Buzl Admin; archive a listing; lifecycle-management context.
- **Preconditions / required data:** Authorized administrative action.
- **Steps:** Move publication state to archived without defining deletion behavior.
- **Validation / private rules:** Preserve internal audit information; do not expose private data.
- **Publication / verification / SEO:** Archived listing is not public/indexable; canonical URL handling remains a later routes/SEO specification.
- **Success / edge / future:** Listing is archived, not deleted by this journey; restoration policy is future.
- **Decision status:** LOCKED.

### J18 — Business name change

- **Actor / goal / entry:** Authorized admin or owner; correct approved canonical name; listing management.
- **Preconditions / required data:** Authorized change and valid canonical replacement.
- **Steps:** Update the canonical identity, assess slug consequence, and preserve historical slug redirect when the approved slug changes.
- **Validation / private rules:** Canonical NAP is controlled; no independent SEO duplicate is edited.
- **Publication / verification / SEO:** Public canonical identity/SEO output derives from the approved data; verification remains independent.
- **Success / edge / future:** Canonical identity is preserved with redirect history; exact approval workflow is future.
- **Decision status:** LOCKED.

### J19 — Business location change

- **Actor / goal / entry:** Authorized admin or owner; update address/location; listing management.
- **Preconditions / required data:** Updated data satisfies the selected mode.
- **Steps:** Update structured location and map location as one user-facing concept; update service areas where relevant; preview public output.
- **Validation / private rules:** Maintain citation consistency; apply privacy rules to address and coordinates.
- **Publication / verification / SEO:** Discovery context may change while canonical listing URL remains stable; verification is separate.
- **Success / edge / future:** Valid location update; public discovery updates conceptually. Provider operations are not specified.
- **Decision status:** LOCKED.

### J20 — Change between storefront, service-area, and hybrid

- **Actor / goal / entry:** Authorized admin or owner; change location mode; listing management.
- **Preconditions / required data:** Existing listing and target-mode requirements.
- **Steps:** Select target mode; supply missing required data; remove/publicly hide data only when permitted; preview.
- **Validation / private rules:** Storefront requires public street address/map; service-area requires named service area and no street address/radius; hybrid requires both. Private coordinates never leak.
- **Publication / verification / SEO:** Revalidate publishability; public location output changes, while verification remains separate.
- **Success / edge / future:** Valid mode change; invalid/missing target data blocks the change. Exact re-review policy is future.
- **Decision status:** LOCKED.

### J21 — Optional profile enrichment

- **Actor / goal / entry:** Authorized admin or owner; enrich an existing listing; onboarding or management.
- **Preconditions / required data:** Existing draft or published listing; optional valid values.
- **Steps:** Add description, services, hours, website, business contact email, logo, cover, social profiles, or year established.
- **Validation / private rules:** Service descriptions/gallery are future; contact email stays hidden unless explicitly made public.
- **Publication / verification / SEO:** Enrichment does not block initial publication; approved public enrichment can appear in public/SEO-derived output.
- **Success / edge / future:** Listing becomes more complete; invalid optional data is rejected without invalidating the minimum record.
- **Decision status:** LOCKED.

### J22 — Business contact email privacy

- **Actor / goal / entry:** Authorized admin or owner; control business contact email visibility; onboarding or management.
- **Preconditions / required data:** Optional business contact email, distinct from account email.
- **Steps:** Enter business contact email; keep it hidden by default; explicitly elect public visibility if desired.
- **Validation / private rules:** Account/login email is always private and never copied to listing contact fields.
- **Publication / verification / SEO:** Visibility controls whether the business contact email is public; it does not affect publication/verification.
- **Success / edge / future:** Correctly private or explicitly public business contact channel; no automatic exposure.
- **Decision status:** LOCKED.

## Public journeys

### J10 — Public visitor opens business listing

- **Actor / goal / entry:** Public Visitor; view a published business; canonical business URL.
- **Preconditions / required data:** Eligible published listing and public-safe data.
- **Steps:** Read business name, category, canonical NAP, description/services/hours where available, website/contact actions, public address/map or service areas, and available logo/cover.
- **Validation / private rules:** Hidden address, private coordinates, and account email never display. Verification badge appears only if later policy permits it.
- **Publication / verification / SEO:** Published canonical page is eligible for derived structured SEO output from canonical data; verification is independent.
- **Success / edge / future:** Visitor sees accurate available data; unpublished/rejected/suspended/archived listings are not public. Exact page IA is future.
- **Decision status:** LOCKED.

### J11 — Public search/discovery

- **Actor / goal / entry:** Public Visitor; find relevant businesses; directory discovery context.
- **Preconditions / required data:** Eligible published listings and supported discovery data.
- **Steps:** Search conceptually by business name, category, service, locality/city, and proximity later/where applicable; use MVP-supported filters.
- **Validation / private rules:** Private addresses/coordinates do not become discovery signals exposed to visitors; tags are excluded.
- **Publication / verification / SEO:** Search results contain eligible published listings; internal search/filter states are not automatically indexable.
- **Success / edge / future:** Relevant results or no-result state; ranking and SQL are outside this document.
- **Decision status:** LOCKED.

### J12 — Category discovery page

- **Actor / goal / entry:** Public Visitor; browse a category; approved category discovery page.
- **Preconditions / required data:** Curated category and eligible published businesses.
- **Steps:** View the category context and eligible listings.
- **Validation / private rules:** One primary category governs MVP category identity; no private listing data appears.
- **Publication / verification / SEO:** Canonical SEO behavior is controlled; arbitrary filter combinations are not promoted automatically.
- **Success / edge / future:** Useful category page or controlled sparse/empty behavior; exact thresholds/routes are future.
- **Decision status:** LOCKED.

### J13 — Location discovery page

- **Actor / goal / entry:** Public Visitor; browse city/locality listings; approved location discovery page.
- **Preconditions / required data:** Location context and eligible published businesses.
- **Steps:** View published listings relevant to the city/locality.
- **Validation / private rules:** Service-area handling is privacy-safe; no exact private address/coordinate leakage.
- **Publication / verification / SEO:** Only published listings appear; location page indexability stays controlled.
- **Success / edge / future:** Useful location page or controlled sparse/empty behavior; exact thresholds/routes are future.
- **Decision status:** LOCKED.

### J14 — Category + location discovery

- **Actor / goal / entry:** Public Visitor; browse a controlled category/location combination; approved discovery context.
- **Preconditions / required data:** Approved category and location combination with eligible listings.
- **Steps:** View the selected controlled combination.
- **Validation / private rules:** Apply public-safe location rules and curated category data.
- **Publication / verification / SEO:** No authorization for automatic indexing of arbitrary faceted URLs.
- **Success / edge / future:** Controlled page or non-indexable application state; exact quality thresholds are future.
- **Decision status:** LOCKED.

## Feature-gated and future journeys

### J23 — External public business registration

- **Actor / goal / entry:** External/Public Business User; future self-service listing; public registration entry when feature-gated on.
- **Preconditions / required data:** Feature is explicitly enabled in a future launch; required data follows the locked field contract.
- **Steps:** Signup → listing creation → moderation/review → publication.
- **Validation / private rules:** Do not enable by default; protect login email/private data and privacy-safe location data.
- **Publication / verification / SEO:** External publication is subject to later moderation policy; nothing is public/indexable before eligible publication.
- **Success / edge / future:** Architecture-ready future journey only; no current-launch external self-service.
- **Decision status:** LOCKED.

### J24 — Future claim flow

- **Actor / goal / entry:** Future Business Manager; request management of an unclaimed public listing; future claim entry.
- **Preconditions / required data:** Existing public listing may be unclaimed; future evidence requirements are unspecified.
- **Steps:** Claim request → evidence → verification → management permission, conceptually.
- **Validation / private rules:** Do not define exact claim verification, evidence, or permissions; protect private data.
- **Publication / verification / SEO:** Claiming does not replace the public listing identity; publication and verification remain separate.
- **Success / edge / future:** Architecture must not block later managers/claims; exact policy is a future workstream.
- **Decision status:** LOCKED.

## Duplicate interaction

All create/edit journeys acknowledge layered duplicate detection. Strong signals include normalized phone, normalized website domain, and legitimate external provider ID. Contextual/fuzzy signals include normalized business name, address, postal code, and proximity. An uncertain duplicate is flagged for review; fuzzy duplicates are never auto-merged. This document defines no scoring algorithm or SQL.

## Error and edge-case matrix

| Case | Journey behavior | Publication / privacy outcome |
|---|---|---|
| Missing required field | Identify the missing Phase 2.1 requirement and prevent publish/submit until corrected. | Not publishable. |
| Invalid phone or website URL | Reject invalid value without inventing a substitute. | Minimum phone blocks publishing; optional website does not. |
| Duplicate suspected / normalized phone duplicate | Flag for review using layered signals; do not auto-merge uncertain matches. | Publication decision remains separate. |
| Invalid category | Require one active curated primary category. | Not publishable. |
| Missing service area | Require at least one named area for service-area/hybrid mode. | Not publishable for those modes. |
| Hidden storefront address conflict | Storefront mode requires a public address/map; change mode or correct visibility/data. | Not publishable as storefront until resolved. |
| Invalid map point / private coordinates | Require a valid public map location only where required; never leak private coordinates. | Privacy-safe public output only. |
| Changed canonical name or location mode | Revalidate NAP/mode requirements; preserve slug redirect requirement when slug changes. | Re-review policy is future; canonical identity rules persist. |
| Rejected, suspended, or archived listing | Apply publication lifecycle; do not treat as verification failure. | Not public/indexable. |
| Unauthenticated or unauthorized edit | Deny the management action. | No public-data or state change. |

## Open decisions

There are no blocking `OPEN_DECISION` items for this journey draft. Exact re-review triggers, external moderation detail, claim evidence, verification methods/badge policy, and discovery quality thresholds remain explicitly deferred to their dedicated Phase 2 workstreams; they do not change the locked boundaries above.

## Approval checklist

- [x] Covers Admin, Client/Owner, Public Visitor, feature-gated External User, and Future Manager concepts.
- [x] Covers J01 through J24 with the required journey fields.
- [x] Preserves Phase 2.1 minimum publishable requirements and privacy rules.
- [x] Separates publication from verification and business contact email from account email.
- [x] Keeps external self-service feature-gated and SEO discovery controlled.
- [x] Contains no implementation, schema, SQL, RLS, UI, or map-provider decision.
