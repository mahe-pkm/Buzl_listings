# Buzl Listing — MVP Business Field Matrix

## 1. Purpose

Define the product/data contract for one Buzl business listing before schema design. This is not SQL or a database schema.

## 2. Scope

Covers the citation-first MVP public listing, its owner/admin-managed information, and the internal concepts needed for publication, verification, provenance, and future management.

## 3. Locked Phase 1 Constraints

- One listing is one `storefront`, `service_area`, or `hybrid` business presence.
- Publication and verification are independent.
- Canonical NAP is controlled source data; normalized values are separate matching aids.
- Canonical listing URL is conceptually `/business/{business-slug}`.
- Categories are curated and hierarchical; services are distinct from categories.
- PostGIS is the geospatial foundation; map/geocoder provider selection is deferred.
- Buzl/owner/trusted-integration data is authoritative; external IDs are references only.

## 4. Field Classification Legend

Tables use these columns: **ID** Field ID; **Sec** Section; **Field** user-facing field; **Internal** conceptual name; **MVP** status; **Req** required; **Pub** public; **Owner/Admin** editable; **Crit** citation critical; **Norm** normalized/matching copy; **Ver** verification applicable; **Search/Filter** discovery use; **Schema** structured-data use; **Private** sensitive/private; **Decision** status.

MVP values: `REQUIRED_MVP`, `OPTIONAL_MVP`, `INTERNAL_MVP`, `FUTURE`, `EXCLUDED`.

Other values use `YES`, `NO`, `CONDITIONAL`, `RESTRICTED`, or `FUTURE` as applicable. `LOCKED` reflects Phase 1; `PROPOSED` is this draft's recommendation; `OPEN_DECISION` requires project-owner approval.

## 5. Business Identity

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BI-01 | Identity | Business name | canonical_name | Public identity | REQUIRED_MVP | YES | YES | RESTRICTED | YES | YES | YES | YES | YES | NO | YES | NO | Non-empty controlled text | Canonical NAP source; old slug redirect on approved rename | LOCKED |
| BI-02 | Identity | Listing slug | slug | Stable route token | INTERNAL_MVP | YES | NO | RESTRICTED | YES | NO | YES | NO | YES | NO | YES | NO | Unique safe slug | Drives derived canonical URL; not a free SEO field | LOCKED |
| BI-03 | Identity | Description | description | Explain business | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | NO | YES | NO | Sanitized length-limited text | Do not invent claims | PROPOSED |
| BI-04 | Identity | Short tagline | short_description | Compact summary | EXCLUDED | NO | NO | NO | RESTRICTED | NO | NO | NO | NO | NO | NO | NO | No separate MVP field | Use description; avoid duplicate copy | PROPOSED |
| BI-05 | Identity | Location mode | location_mode | Storefront/service-area behavior | REQUIRED_MVP | YES | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | One locked value | `storefront`, `service_area`, or `hybrid` | LOCKED |
| BI-06 | Identity | Primary category | primary_category | Main taxonomy identity | REQUIRED_MVP | YES | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Must be active curated category | One primary category | LOCKED |
| BI-07 | Identity | Secondary categories | secondary_categories | Additional taxonomy relevance | FUTURE | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | YES | NO | Curated values only | MVP inclusion unresolved | OPEN_DECISION |
| BI-08 | Identity | Year established | year_established | Optional history | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | YES | NO | YES | NO | Plausible past year | Omit when unknown | PROPOSED |

## 6. Citation / NAP

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NAP-01 | NAP | Canonical business name | canonical_name | Citation identity | REQUIRED_MVP | YES | YES | RESTRICTED | YES | YES | YES | YES | YES | NO | YES | NO | Same controlled value as BI-01 | No independent SEO copy | LOCKED |
| NAP-02 | NAP | Primary phone | primary_phone_display | Primary public contact | REQUIRED_MVP | YES | YES | YES | YES | YES | YES | YES | YES | NO | YES | NO | Valid displayable phone | Canonical public phone | PROPOSED |
| NAP-03 | NAP | Normalized primary phone | primary_phone_normalized | Matching/duplicate signal | INTERNAL_MVP | YES | NO | NO | YES | NO | YES | YES | YES | NO | NO | YES | Normalize from NAP-02 | Never independently owner-edited | LOCKED |
| NAP-04 | NAP | Alternate phone | alternate_phone | Secondary contact | OPTIONAL_MVP | NO | YES | YES | YES | NO | YES | FUTURE | YES | NO | YES | NO | Valid phone | Distinct from primary where possible | PROPOSED |
| NAP-05 | NAP | WhatsApp number | whatsapp_phone | Messaging contact | OPTIONAL_MVP | NO | YES | YES | YES | NO | YES | FUTURE | YES | NO | YES | NO | Valid phone | Visibility follows contact policy | PROPOSED |
| NAP-06 | NAP | Address line 1 | address_line_1 | Street address | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | NO | YES | YES | Structured text | Required for storefront; may be private for service area | LOCKED |
| NAP-07 | NAP | Address line 2 | address_line_2 | Additional address detail | OPTIONAL_MVP | NO | CONDITIONAL | YES | YES | YES | YES | NO | YES | NO | YES | YES | Structured text | Public only when address is public | PROPOSED |
| NAP-08 | NAP | Locality | locality | Address/discovery detail | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Curated/validated locality when available | Needed with public address or service area | PROPOSED |
| NAP-09 | NAP | City | city | Citation/discovery location | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Valid location hierarchy member | Required for public location context | PROPOSED |
| NAP-10 | NAP | District | district | Address hierarchy | OPTIONAL_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | NO | YES | YES | YES | YES | Valid hierarchy member | Required only where applicable | PROPOSED |
| NAP-11 | NAP | State | state | Address hierarchy | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Valid hierarchy member | Required with Indian public address/service area | PROPOSED |
| NAP-12 | NAP | Country | country | Address country | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Controlled country | Required with address/service area | PROPOSED |
| NAP-13 | NAP | Country code | country_code | Normalized country identity | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | YES | NO | YES | YES | NO | NO | Standard code | Derived/selected from country | PROPOSED |
| NAP-14 | NAP | Postal/PIN code | postal_code | Citation/location precision | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Preserve leading zeroes | Required where address/service area supports it | PROPOSED |
| NAP-15 | NAP | Formatted display address | display_address | Public address rendering | INTERNAL_MVP | CONDITIONAL | CONDITIONAL | NO | RESTRICTED | YES | NO | NO | YES | NO | YES | YES | Derived from structured source | Never separately editable | LOCKED |
| NAP-16 | NAP | Address visibility | show_street_address | Privacy control | REQUIRED_MVP | YES | NO | YES | YES | NO | NO | YES | NO | NO | NO | YES | Explicit Boolean/policy value | Separate from address storage | LOCKED |

## 7. Contact Information

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CT-01 | Contact | Primary email | email | Optional contact channel | OPTIONAL_MVP | NO | CONDITIONAL | YES | YES | NO | NO | FUTURE | NO | NO | CONDITIONAL | YES | Valid email | Public visibility controlled separately | PROPOSED |
| CT-02 | Contact | Public email visibility | show_email | Email privacy control | OPTIONAL_MVP | NO | NO | YES | YES | NO | NO | NO | NO | NO | NO | YES | Explicit value | Default policy is open decision | OPEN_DECISION |
| CT-03 | Contact | Website URL | website_url | Official website contact | OPTIONAL_MVP | NO | YES | YES | YES | NO | YES | FUTURE | YES | NO | YES | NO | Valid absolute URL | Must be owner/Buzl-provided | PROPOSED |
| CT-04 | Contact | Normalized website domain | website_domain_normalized | Matching signal | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | YES | NO | YES | NO | NO | NO | Derived from website URL | Never public identity | LOCKED |

## 8. Address & Location

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AL-01 | Address | Primary physical address | primary_address | Canonical location record | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | NO | YES | YES | Uses NAP components | Storefront requires a valid public address; service area may retain private address | LOCKED |
| AL-02 | Address | Latitude | latitude | Coordinate component | REQUIRED_MVP | CONDITIONAL | NO | RESTRICTED | YES | NO | NO | FUTURE | YES | YES | YES | YES | Valid coordinate range | Source for map point; exact capture policy open | PROPOSED |
| AL-03 | Address | Longitude/geographic point | geo_point | Canonical geospatial location | REQUIRED_MVP | CONDITIONAL | NO | RESTRICTED | YES | NO | NO | FUTURE | YES | YES | YES | YES | Valid coordinate range | PostGIS-ready conceptual point; no provider selection | LOCKED |

## 9. Storefront / Service Area

Do not represent a service area as a fake street address. Storefront address, address visibility, service-area locations, and optional radius are separate product concepts.

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SA-01 | Service area | Service-area locations | service_areas | Public coverage area | REQUIRED_MVP | CONDITIONAL | YES | YES | YES | NO | NO | FUTURE | YES | YES | NO | NO | Valid curated locations | Required for service_area/hybrid publishability | PROPOSED |
| SA-02 | Service area | Service radius | service_radius | Optional coverage precision | FUTURE | NO | CONDITIONAL | YES | YES | NO | NO | NO | YES | YES | NO | NO | Positive bounded distance | Do not require for MVP | OPEN_DECISION |
| SA-03 | Service area | Public directions availability | directions_enabled | Offer directions action | OPTIONAL_MVP | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | NO | NO | NO | NO | Needs public map point/address | Hide when address/location privacy prevents directions | PROPOSED |

## 10. Categories

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CA-01 | Category | Primary category | primary_category | Main curated classification | REQUIRED_MVP | YES | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Active Buzl category | One required primary category | LOCKED |
| CA-02 | Category | Secondary categories | secondary_categories | Additional classifications | FUTURE | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | YES | NO | Curated categories only | Inclusion in MVP unresolved | OPEN_DECISION |

## 11. Services

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SV-01 | Service | Services offered | services | Describe offerings | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | NO | NO | Related to category | Service governance/storage model unresolved | OPEN_DECISION |
| SV-02 | Service | Service name | service_name | Service label | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | NO | NO | Controlled or owner-entered pending decision | Never substitute for category | OPEN_DECISION |
| SV-03 | Service | Service description | service_description | Explain service | FUTURE | NO | YES | YES | YES | NO | NO | NO | YES | NO | NO | NO | Sanitized length-limited text | Add only if service model warrants it | OPEN_DECISION |

## 12. Tags / Attributes

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-01 | Tags | Controlled attributes | tags | Cross-cutting descriptors | FUTURE | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | NO | NO | No unrestricted free-text tags | MVP inclusion/governance unresolved | OPEN_DECISION |

## 13. Business Hours

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BH-01 | Hours | Day of week | hours_day | Weekly schedule key | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | One valid weekday | Omit hours block when unavailable | PROPOSED |
| BH-02 | Hours | Opening time | opens_at | Start of normal interval | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Valid time | Required unless closed/24-hour | PROPOSED |
| BH-03 | Hours | Closing time | closes_at | End of normal interval | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Valid time | Required unless closed/24-hour | PROPOSED |
| BH-04 | Hours | Closed day | is_closed | Closed-state flag | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Explicit Boolean | Mutually consistent with hours | PROPOSED |
| BH-05 | Hours | 24-hour status | is_24_hours | Always-open flag | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Explicit Boolean | Excludes normal interval | PROPOSED |
| BH-06 | Hours | Multiple/special hours | special_hours | Holidays/multiple intervals | FUTURE | NO | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Future policy | Not required for MVP | LOCKED |

## 14. Website & Social Profiles

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WS-01 | Social | Facebook URL | facebook_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | PROPOSED |
| WS-02 | Social | Instagram URL | instagram_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | PROPOSED |
| WS-03 | Social | LinkedIn URL | linkedin_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | PROPOSED |
| WS-04 | Social | YouTube URL | youtube_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | PROPOSED |
| WS-05 | Social | X/Twitter URL | x_url | Public profile link | FUTURE | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Add only if approved | OPEN_DECISION |
| WS-06 | Social | Other public profile URL | other_profile_url | Additional legitimate profile | FUTURE | NO | YES | RESTRICTED | YES | NO | NO | FUTURE | NO | NO | YES | NO | Allowlisted platform/policy | Avoid arbitrary link spam | OPEN_DECISION |

## 15. Media

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ME-01 | Media | Business logo | logo | Brand identity image | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | NO | NO | YES | NO | Limits/types deferred | Optional enrichment | PROPOSED |
| ME-02 | Media | Cover image | cover_image | Listing header image | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | NO | NO | YES | NO | Limits/types deferred | Optional enrichment | PROPOSED |
| ME-03 | Media | Gallery images | gallery_images | Additional visual context | FUTURE | NO | YES | YES | YES | NO | NO | NO | NO | NO | YES | NO | Limits/types/count unresolved | No video/media marketplace scope | OPEN_DECISION |

## 16. Map / Geographic Data

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MG-01 | Geo | Canonical map point | geo_point | Map/proximity source | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | RESTRICTED | YES | NO | NO | FUTURE | YES | YES | YES | YES | Valid point | Required when map/public location applies | LOCKED |
| MG-02 | Geo | Location provider source | geocode_source | Provenance of coordinate suggestion | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Provider-neutral value | No vendor selected | OPEN_DECISION |
| MG-03 | Geo | External place/provider ID | external_place_id | Legitimate external reference | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | YES | FUTURE | YES | NO | NO | YES | Provider namespace required | Reference only, never Buzl identity | LOCKED |

## 17. SEO-Derived Fields

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SD-01 | SEO | Canonical URL | canonical_url | Canonical public route | INTERNAL_MVP | YES | YES | NO | RESTRICTED | YES | NO | NO | YES | NO | YES | NO | Derived from slug | `/business/{business-slug}`; not independently editable | LOCKED |
| SD-02 | SEO | SEO page title | seo_title | Search/social title | INTERNAL_MVP | CONDITIONAL | YES | NO | RESTRICTED | NO | NO | NO | NO | NO | NO | NO | Derived from real data | No editable duplicate NAP/title field | LOCKED |
| SD-03 | SEO | Meta description | meta_description | Search snippet direction | INTERNAL_MVP | CONDITIONAL | YES | NO | RESTRICTED | NO | NO | NO | NO | NO | NO | NO | Derived from real data where sufficient | Do not invent claims | LOCKED |
| SD-04 | SEO | LocalBusiness JSON-LD | local_business_jsonld | Structured data output | INTERNAL_MVP | CONDITIONAL | YES | NO | RESTRICTED | YES | NO | NO | NO | NO | YES | NO | Generated from canonical data | No separate schema-edit form | LOCKED |
| SD-05 | SEO | Breadcrumb information | breadcrumb_data | Navigation/schema context | INTERNAL_MVP | CONDITIONAL | YES | NO | RESTRICTED | NO | NO | NO | NO | NO | YES | NO | Derived from canonical route/taxonomy | Controlled discovery context only | LOCKED |

## 18. Publication

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PB-01 | Publication | Publication status | publication_status | Public lifecycle | INTERNAL_MVP | YES | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | NO | YES | Locked state set | Publication is independent from verification | LOCKED |
| PB-02 | Publication | Submitted at | submitted_at | Submission audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | System timestamp | Set on submit | PROPOSED |
| PB-03 | Publication | Published at/by | published_at/published_by | Publication audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Trusted actor/time only | Set on publish | PROPOSED |
| PB-04 | Publication | Rejected at/reason | rejected_at/reason | Rejection handling | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Reason required on rejection policy | Owner visibility/policy remains open | OPEN_DECISION |
| PB-05 | Publication | Suspended at/reason | suspended_at/reason | Suspension handling | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Trusted actor/time only | Never combine with verification state | PROPOSED |
| PB-06 | Publication | Archived at | archived_at | Archive audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | System timestamp | Archive remains a publication state | PROPOSED |

## 19. Verification

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| VE-01 | Verification | Verification status | verification_status | Trust state | INTERNAL_MVP | YES | CONDITIONAL | NO | YES | NO | NO | YES | YES | YES | YES | YES | Locked state set | Independent from publication; badge policy open | LOCKED |
| VE-02 | Verification | Verification method | verification_method | Evidence type | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Method policy needed | OTP/domain/manual details not selected | OPEN_DECISION |
| VE-03 | Verification | Verified at/by | verified_at/verified_by | Verification audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | YES | NO | NO | NO | YES | Trusted actor/time only | Populate when verified | PROPOSED |

## 20. External References

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ER-01 | External | Buzl client/business reference | buzl_reference | Internal Buzl linkage | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | YES | FUTURE | YES | NO | NO | YES | Trusted source only | Reference, not public identity | LOCKED |
| ER-02 | External | Google Place ID | google_place_id | Legitimate external reference | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | YES | FUTURE | YES | NO | NO | YES | Only legitimately provided | No Google provider selection implied | LOCKED |
| ER-03 | External | External provider ID/URL | external_reference | Integration reference | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | YES | FUTURE | YES | NO | NO | YES | Provider namespace + valid URL | Never primary Buzl identity | LOCKED |

## 21. Provenance & Internal Metadata

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PR-01 | Provenance | Created source | created_source | Record origin | INTERNAL_MVP | YES | NO | NO | YES | NO | NO | NO | NO | YES | NO | YES | Allowed conceptual source values | `buzl_admin`, `buzl_client`, `public_signup`, `trusted_import` | PROPOSED |
| PR-02 | Provenance | Created by/at | created_by/created_at | Creation audit | INTERNAL_MVP | YES | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Trusted actor/time only | System managed | PROPOSED |
| PR-03 | Provenance | Updated at | updated_at | Change timestamp | INTERNAL_MVP | YES | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | System timestamp | System managed | PROPOSED |
| PR-04 | Provenance | Last verified at | last_verified_at | Current verification recency | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | YES | NO | NO | NO | YES | Trusted timestamp | Same event as verified_at until later policy | PROPOSED |

## 22. Ownership / Management Concepts

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OM-01 | Ownership | Owner/manager relationship | business_management | Authorized editing concept | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | YES | NO | NO | NO | YES | Trusted membership only | Public business must exist unclaimed | LOCKED |
| OM-02 | Ownership | Claim status/request | claim_status | Future claim flow | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Verification policy required | No join-table schema in this matrix | OPEN_DECISION |
| OM-03 | Ownership | Multiple managers | manager_roles | Future shared management | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Trusted membership only | Architecture must permit later support | LOCKED |

## 23. Explicitly Excluded from MVP

| Field | Reason | Decision |
|---|---|---|
| Aadhaar, PAN, personal government ID, owner date of birth, private personal documents | Not part of a citation-first business profile; unnecessarily sensitive | LOCKED |
| Bank, card, payment, booking, marketplace data | Payments/booking are explicitly outside MVP | LOCKED |
| Passwords, auth secrets, API keys | Authentication/security secrets do not belong in a business listing record | LOCKED |
| Consumer review fields, paid ranking, quote/chat marketplace fields | Explicitly outside MVP product scope | LOCKED |

## 24. Open Decisions

| ID | Decision | Why unresolved | Options | Blocks which later workstream? |
|---|---|---|---|---|
| OD-01 | Secondary categories in MVP | Phase 1 allows only one primary category and defers additional categories | MVP none / curated secondary categories | Taxonomy & schema |
| OD-02 | Service governance/storage | Phase 1 keeps category/service separate but defers representation | Controlled reusable services / owner-defined services | Taxonomy, schema, onboarding |
| OD-03 | Tags in MVP and governance | Phase 1 says tags require Phase 2 approval | Exclude / controlled selectable tags | Taxonomy, search, moderation |
| OD-04 | Public email default | Contact visibility policy is not locked | Hidden default / public default / owner choice | Onboarding, public IA |
| OD-05 | Gallery images in MVP | Phase 1 permits optional extra media but not exact scope | Logo+cover only / limited gallery | Media policy, storage |
| OD-06 | Service-area count and radius | Representation exists conceptually but limits are not locked | Named locations only / bounded radius / both | Taxonomy, schema, maps |
| OD-07 | Verification required before publishing | State model is locked; publish rule is not | No requirement / trusted-client fast path / verification gate | Verification, moderation |
| OD-08 | External-user publish policy | External launch behavior is deferred | Feature-gated / pending review / limited publish | User journeys, moderation |
| OD-09 | Minimum publishable fields | Product direction identifies candidates, not final enforcement | Approve recommendation below / adjust requirements | Onboarding, schema, validation |
| OD-10 | MVP authentication UX | Supabase Auth is locked; credential UX is not | Email/password / magic link | Auth flow |

## 25. Business Listing Completeness Levels

- **Level 1 — Minimum Citation Record:** approved minimum publishable fields, controlled NAP, one primary category, appropriate location context, and a publishable status.
- **Level 2 — Complete Business Profile:** Level 1 plus description, business hours, services when approved, website, and logo.
- **Level 3 — Enhanced Profile:** Level 2 plus cover/gallery if approved, social profiles, and controlled attributes if approved.

These are profile-completeness levels, not paid plans.

## 26. Recommended MVP Minimum Publishable Record

**Recommendation awaiting approval (OD-09):**

- canonical business name;
- stable slug;
- location mode;
- one active primary category;
- primary display phone and its normalized matching copy;
- publication status eligible for publication;
- structured location context: country, state, city/locality, and postal/PIN code where applicable;
- storefront: a valid public physical address and coordinate/map point;
- service-area: at least one public service-area location, with a private street address permitted;
- hybrid: both a valid public storefront address and at least one service-area location;
- address visibility policy;
- independent verification status (which may remain `unverified` unless OD-07 changes the publish policy).

## 27. Phase 2 Follow-Up Dependencies

- User journeys: OD-04, OD-08, OD-09, OD-10.
- Database schema: every internal/derived field, OD-01, OD-02, OD-05, OD-06.
- RLS matrix: owner/admin edit rules and sensitive-field visibility.
- Verification/duplicates: OD-07 plus evidence/method details.
- Taxonomy/locations: OD-01, OD-02, OD-03, OD-06.
- Routes/SEO: derived URL, metadata, schema, and publish/indexability policy.
- Maps provider: provider selection remains a separate Phase 2 workstream.

## 28. Approval Checklist

- [ ] All proposed field classifications are approved or amended.
- [ ] Every open decision has an owner and resolution path.
- [ ] The minimum publishable record is approved.
- [ ] No NAP field has an independently editable SEO duplicate.
- [ ] Publication and verification remain separate.
- [ ] Service-area privacy remains supported.
- [ ] No map provider, SQL schema, RLS policy, migration, UI, or application implementation is authorized by this document.
