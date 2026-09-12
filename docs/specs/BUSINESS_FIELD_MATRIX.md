# Buzl Listing — MVP Business Field Matrix

**Status:** LOCKED — Phase 2.1 approved

This is the authoritative product/data field contract for subsequent Phase 2 work. It is not a SQL schema, migration design, RLS implementation, or UI implementation.

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

Other values use `YES`, `NO`, `CONDITIONAL`, `RESTRICTED`, or `FUTURE` as applicable. Every field classification and decision in this approved Phase 2.1 contract is `LOCKED`.

## 5. Business Identity

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BI-01 | Identity | Business name | canonical_name | Public identity | REQUIRED_MVP | YES | YES | RESTRICTED | YES | YES | YES | YES | YES | NO | YES | NO | Non-empty controlled text | Canonical NAP source; old slug redirect on approved rename | LOCKED |
| BI-02 | Identity | Listing slug | slug | Stable route token | INTERNAL_MVP | YES | NO | RESTRICTED | YES | NO | YES | NO | YES | NO | YES | NO | Unique safe slug | Drives derived canonical URL; not a free SEO field | LOCKED |
| BI-03 | Identity | Description | description | Explain business | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | NO | YES | NO | Sanitized length-limited text | Do not invent claims | LOCKED |
| BI-04 | Identity | Short tagline | short_description | Compact summary | EXCLUDED | NO | NO | NO | RESTRICTED | NO | NO | NO | NO | NO | NO | NO | No separate MVP field | Use description; avoid duplicate copy | LOCKED |
| BI-05 | Identity | Location mode | location_mode | Storefront/service-area behavior | REQUIRED_MVP | YES | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | One locked value | `storefront`, `service_area`, or `hybrid` | LOCKED |
| BI-06 | Identity | Primary category | primary_category | Main taxonomy identity | REQUIRED_MVP | YES | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Must be active curated category | One primary category | LOCKED |
| BI-07 | Identity | Secondary categories | secondary_categories | Additional taxonomy relevance | FUTURE | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | YES | NO | Curated values only | Exactly one primary category in MVP; secondary categories are FUTURE | LOCKED |
| BI-08 | Identity | Year established | year_established | Optional history | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | YES | NO | YES | NO | Plausible past year | Omit when unknown | LOCKED |

## 6. Citation / NAP

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NAP-01 | NAP | Canonical business name | canonical_name | Citation identity | REQUIRED_MVP | YES | YES | RESTRICTED | YES | YES | YES | YES | YES | NO | YES | NO | Same controlled value as BI-01 | No independent SEO copy | LOCKED |
| NAP-02 | NAP | Primary phone | primary_phone_display | Primary public contact | REQUIRED_MVP | YES | YES | YES | YES | YES | YES | YES | YES | NO | YES | NO | Valid displayable phone | Canonical public phone | LOCKED |
| NAP-03 | NAP | Normalized primary phone | primary_phone_normalized | Matching/duplicate signal | INTERNAL_MVP | YES | NO | NO | YES | NO | YES | YES | YES | NO | NO | YES | Normalize from NAP-02 | Never independently owner-edited | LOCKED |
| NAP-04 | NAP | Alternate phone | alternate_phone | Secondary contact | OPTIONAL_MVP | NO | YES | YES | YES | NO | YES | FUTURE | YES | NO | YES | NO | Valid phone | Distinct from primary where possible | LOCKED |
| NAP-05 | NAP | WhatsApp number | whatsapp_phone | Messaging contact | OPTIONAL_MVP | NO | YES | YES | YES | NO | YES | FUTURE | YES | NO | YES | NO | Valid phone | Visibility follows contact policy | LOCKED |
| NAP-06 | NAP | Address line 1 | address_line_1 | Street address | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | NO | YES | YES | Structured text | Required and public for storefront; not required for pure service-area publication | LOCKED |
| NAP-07 | NAP | Address line 2 | address_line_2 | Additional address detail | OPTIONAL_MVP | NO | CONDITIONAL | YES | YES | YES | YES | NO | YES | NO | YES | YES | Structured text | Public only when address is public | LOCKED |
| NAP-08 | NAP | Locality | locality | Address/discovery detail | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Curated/validated locality when available | Needed with public address or service area | LOCKED |
| NAP-09 | NAP | City | city | Citation/discovery location | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Valid location hierarchy member | Required for public location context | LOCKED |
| NAP-10 | NAP | District | district | Address hierarchy | OPTIONAL_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | NO | YES | YES | YES | YES | Valid hierarchy member | Required only where applicable | LOCKED |
| NAP-11 | NAP | State | state | Address hierarchy | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Valid hierarchy member | Required with Indian public address/service area | LOCKED |
| NAP-12 | NAP | Country | country | Address country | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Controlled country | Required with address/service area | LOCKED |
| NAP-13 | NAP | Country code | country_code | Normalized country identity | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | YES | NO | YES | YES | NO | NO | Standard code | Derived/selected from country | LOCKED |
| NAP-14 | NAP | Postal/PIN code | postal_code | Citation/location precision | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | YES | YES | YES | Preserve leading zeroes | Required where address/service area supports it | LOCKED |
| NAP-15 | NAP | Formatted display address | display_address | Public address rendering | INTERNAL_MVP | CONDITIONAL | CONDITIONAL | NO | RESTRICTED | YES | NO | NO | YES | NO | YES | YES | Derived from structured source | Never separately editable | LOCKED |
| NAP-16 | NAP | Address visibility | show_street_address | Privacy control | REQUIRED_MVP | YES | NO | YES | YES | NO | NO | YES | NO | NO | NO | YES | Explicit Boolean/policy value | Separate from address storage | LOCKED |

## 7. Contact Information

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CT-01 | Contact | Business contact email | business_contact_email | Optional contact channel | OPTIONAL_MVP | NO | CONDITIONAL | YES | YES | NO | NO | FUTURE | NO | NO | CONDITIONAL | YES | Valid email | Separate from auth/login email; never expose an account/Supabase email automatically | LOCKED |
| CT-02 | Contact | Public email visibility | show_email | Email privacy control | OPTIONAL_MVP | NO | NO | YES | YES | NO | NO | NO | NO | NO | NO | YES | Explicit value | Hidden by default; owner may explicitly make the business contact email public | LOCKED |
| CT-03 | Contact | Website URL | website_url | Official website contact | OPTIONAL_MVP | NO | YES | YES | YES | NO | YES | FUTURE | YES | NO | YES | NO | Valid absolute URL | Must be owner/Buzl-provided | LOCKED |
| CT-04 | Contact | Normalized website domain | website_domain_normalized | Matching signal | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | YES | NO | YES | NO | NO | NO | Derived from website URL | Never public identity | LOCKED |

## 8. Address & Location

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AL-01 | Address | Primary physical address | primary_address | Canonical location record | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | YES | YES | YES | YES | YES | YES | NO | YES | YES | Uses NAP components | Storefront requires a valid public address; pure service-area publication requires no private or public street address | LOCKED |
| AL-02 | Address | Latitude component | latitude | Internal coordinate component | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | RESTRICTED | YES | NO | NO | FUTURE | YES | YES | CONDITIONAL | YES | Valid coordinate range | Part of one system-managed map location; private coordinates never leak through public HTML, JSON-LD, public APIs, maps, or metadata when location/address privacy applies | LOCKED |
| AL-03 | Address | Geographic point | geo_point | Canonical geospatial location | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | RESTRICTED | YES | NO | NO | FUTURE | YES | YES | CONDITIONAL | YES | Valid coordinate range | One system-managed map location, not a separately editable user concept; private coordinates never leak through public HTML, JSON-LD, public APIs, maps, or metadata when location/address privacy applies | LOCKED |

## 9. Storefront / Service Area

Do not represent a service area as a fake street address. Storefront address, address visibility, service-area locations, and optional radius are separate product concepts.

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SA-01 | Service area | Named service-area locations | service_areas | Public coverage area | REQUIRED_MVP | CONDITIONAL | YES | YES | YES | NO | NO | FUTURE | YES | YES | NO | NO | Valid curated locations | At least one named service area is required for service_area/hybrid publishability | LOCKED |
| SA-02 | Service area | Service radius | service_radius | Optional coverage precision | FUTURE | NO | CONDITIONAL | YES | YES | NO | NO | NO | YES | YES | NO | NO | Positive bounded distance | Service radius is FUTURE and not required for MVP | LOCKED |
| SA-03 | Service area | Public directions availability | directions_enabled | Offer directions action | OPTIONAL_MVP | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | NO | NO | NO | NO | Needs public map point/address | Hide when address/location privacy prevents directions | LOCKED |

## 10. Categories

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CA-01 | Category | Primary category | primary_category | Main curated classification | REQUIRED_MVP | YES | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Active Buzl category | One required primary category | LOCKED |
| CA-02 | Category | Secondary categories | secondary_categories | Additional classifications | FUTURE | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | YES | NO | Curated categories only | Exactly one active primary category in MVP; secondary categories are FUTURE | LOCKED |

## 11. Services

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SV-01 | Service | Services offered | services | Describe offerings | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | NO | NO | Related to category | Owner-defined service names are supported in MVP and remain separate from categories | LOCKED |
| SV-02 | Service | Service name | service_name | Service label | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | NO | NO | Owner-defined text | No controlled service taxonomy in MVP; never substitutes for category | LOCKED |
| SV-03 | Service | Service description | service_description | Explain service | FUTURE | NO | YES | YES | YES | NO | NO | NO | YES | NO | NO | NO | Sanitized length-limited text | Service descriptions are FUTURE | LOCKED |

## 12. Tags / Attributes

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-01 | Tags | Controlled attributes | tags | Cross-cutting descriptors | FUTURE | NO | CONDITIONAL | RESTRICTED | YES | NO | NO | NO | YES | YES | NO | NO | No unrestricted free-text tags | Tags are excluded from MVP; controlled attributes may return later | LOCKED |

## 13. Business Hours

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BH-01 | Hours | Day of week | hours_day | Weekly schedule key | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | One valid weekday | Omit hours block when unavailable | LOCKED |
| BH-02 | Hours | Opening time | opens_at | Start of normal interval | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Valid time | Required unless closed/24-hour | LOCKED |
| BH-03 | Hours | Closing time | closes_at | End of normal interval | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Valid time | Required unless closed/24-hour | LOCKED |
| BH-04 | Hours | Closed day | is_closed | Closed-state flag | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Explicit Boolean | Mutually consistent with hours | LOCKED |
| BH-05 | Hours | 24-hour status | is_24_hours | Always-open flag | OPTIONAL_MVP | CONDITIONAL | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Explicit Boolean | Excludes normal interval | LOCKED |
| BH-06 | Hours | Multiple regular intervals per day | regular_intervals | Split-shift regular hours | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Valid non-overlapping intervals | Conceptually supported in MVP, for example 09:00–13:00 and 16:00–20:00 | LOCKED |
| BH-07 | Hours | Special / holiday hours | special_hours | Temporary exceptions | FUTURE | NO | YES | YES | YES | NO | NO | NO | YES | YES | YES | NO | Future policy | Separate from regular split-shift intervals; not in MVP | LOCKED |

## 14. Website & Social Profiles

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WS-01 | Social | Facebook URL | facebook_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | LOCKED |
| WS-02 | Social | Instagram URL | instagram_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | LOCKED |
| WS-03 | Social | LinkedIn URL | linkedin_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | LOCKED |
| WS-04 | Social | YouTube URL | youtube_url | Public profile link | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Omit when absent | LOCKED |
| WS-05 | Social | X/Twitter URL | x_url | Public profile link | FUTURE | NO | YES | YES | YES | NO | NO | FUTURE | NO | NO | YES | NO | Valid platform URL | Add only if approved | LOCKED |
| WS-06 | Social | Other public profile URL | other_profile_url | Additional legitimate profile | FUTURE | NO | YES | RESTRICTED | YES | NO | NO | FUTURE | NO | NO | YES | NO | Allowlisted platform/policy | Avoid arbitrary link spam | LOCKED |

## 15. Media

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ME-01 | Media | Business logo | logo | Brand identity image | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | NO | NO | YES | NO | Limits/types deferred | Optional enrichment | LOCKED |
| ME-02 | Media | Cover image | cover_image | Listing header image | OPTIONAL_MVP | NO | YES | YES | YES | NO | NO | NO | NO | NO | YES | NO | Limits/types deferred | Optional enrichment | LOCKED |
| ME-03 | Media | Gallery images | gallery_images | Additional visual context | FUTURE | NO | YES | YES | YES | NO | NO | NO | NO | NO | YES | NO | Limits/types/count unresolved | Gallery is FUTURE; MVP media is optional logo and cover only | LOCKED |

## 16. Map / Geographic Data

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MG-01 | Geo | Canonical map location | geo_point | Map/proximity source | REQUIRED_MVP | CONDITIONAL | CONDITIONAL | RESTRICTED | YES | NO | NO | FUTURE | YES | YES | CONDITIONAL | YES | Valid point | One user-facing map pin/location concept; private coordinates never leak through public HTML, JSON-LD, public APIs, maps, or metadata when location/address privacy applies | LOCKED |
| MG-02 | Geo | Location provider source | geocode_source | Provenance of coordinate suggestion | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Provider-neutral value | No map provider is selected; exact provider source representation belongs to later schema work | LOCKED |
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
| PB-01 | Publication | Publication status | publication_status | Public lifecycle | INTERNAL_MVP | YES | NO | RESTRICTED | YES | NO | NO | NO | YES | YES | NO | YES | Locked state set | Publication lifecycle is internal and independent from verification | LOCKED |
| PB-02 | Publication | Submitted at | submitted_at | Submission audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | System timestamp | Set on submit | LOCKED |
| PB-03 | Publication | Published at/by | published_at/published_by | Publication audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Trusted actor/time only | Set on publish | LOCKED |
| PB-04 | Publication | Rejected at/reason | rejected_at/reason | Rejection handling | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Reason required on rejection policy | Internal audit state; owner-facing rejection-detail policy is future work | LOCKED |
| PB-05 | Publication | Suspended at/reason | suspended_at/reason | Suspension handling | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Trusted actor/time only | Never combine with verification state | LOCKED |
| PB-06 | Publication | Archived at | archived_at | Archive audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | System timestamp | Archive remains a publication state | LOCKED |

## 19. Verification

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| VE-01 | Verification | Verification status | verification_status | Trust state | INTERNAL_MVP | YES | CONDITIONAL | NO | YES | NO | NO | YES | YES | YES | NO | YES | Locked state set | Internal/product trust concept; independent from publication and not a made-up LocalBusiness schema property | LOCKED |
| VE-02 | Verification | Verification method | verification_method | Evidence type | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Method policy needed | Verification methods are future work; no method is selected for MVP | LOCKED |
| VE-03 | Verification | Verified at/by | verified_at/verified_by | Verification audit | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | YES | NO | NO | NO | YES | Trusted actor/time only | Populate when verified | LOCKED |

## 20. External References

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ER-01 | External | Buzl client/business reference | buzl_reference | Internal Buzl linkage | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | NO | FUTURE | YES | NO | NO | YES | Trusted source only | Retain provider/reference IDs exactly as issued; reference, not public identity | LOCKED |
| ER-02 | External | Google Place ID | google_place_id | Legitimate external reference | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | NO | FUTURE | YES | NO | NO | YES | Only legitimately provided | Retain exactly as issued; no Google provider selection implied | LOCKED |
| ER-03 | External | External provider ID/URL | external_reference | Integration reference | OPTIONAL_MVP | NO | NO | RESTRICTED | YES | NO | NO | FUTURE | YES | NO | NO | YES | Provider namespace + valid URL | Retain ID exactly as issued; never primary Buzl identity | LOCKED |

## 21. Provenance & Internal Metadata

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PR-01 | Provenance | Created source | created_source | Record origin | INTERNAL_MVP | YES | NO | NO | YES | NO | NO | NO | NO | YES | NO | YES | Allowed conceptual source values | `buzl_admin`, `buzl_client`, `public_signup`, `trusted_import` | LOCKED |
| PR-02 | Provenance | Created by/at | created_by/created_at | Creation audit | INTERNAL_MVP | YES | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | Trusted actor/time only | System managed | LOCKED |
| PR-03 | Provenance | Updated at | updated_at | Change timestamp | INTERNAL_MVP | YES | NO | NO | YES | NO | NO | NO | NO | NO | NO | YES | System timestamp | System managed | LOCKED |
| PR-04 | Provenance | Last verified at | last_verified_at | Current verification recency | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | YES | NO | NO | NO | YES | Trusted timestamp | Same event as verified_at until later policy | LOCKED |

## 22. Ownership / Management Concepts

| ID | Sec | Field | Internal | Purpose | MVP | Req | Pub | Owner | Admin | Crit | Norm | Ver | Search | Filter | Schema | Private | Validation | Behavior | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OM-01 | Ownership | Owner/manager relationship | business_management | Authorized editing concept | INTERNAL_MVP | CONDITIONAL | NO | NO | YES | NO | NO | YES | NO | NO | NO | YES | Trusted membership only | Public business must exist unclaimed | LOCKED |
| OM-02 | Ownership | Claim status/request | claim_status | Future claim flow | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Verification policy required | No join-table schema in this matrix | LOCKED |
| OM-03 | Ownership | Multiple managers | manager_roles | Future shared management | FUTURE | NO | NO | NO | YES | NO | NO | FUTURE | NO | NO | NO | YES | Trusted membership only | Architecture must permit later support | LOCKED |

## 23. Explicitly Excluded from MVP

| Field | Reason | Decision |
|---|---|---|
| Aadhaar, PAN, personal government ID, owner date of birth, private personal documents | Not part of a citation-first business profile; unnecessarily sensitive | LOCKED |
| Bank, card, payment, booking, marketplace data | Payments/booking are explicitly outside MVP | LOCKED |
| Passwords, auth secrets, API keys | Authentication/security secrets do not belong in a business listing record | LOCKED |
| Consumer review fields, paid ranking, quote/chat marketplace fields | Explicitly outside MVP product scope | LOCKED |

## 24. Phase 2.1 Decision Lock

All Phase 2.1 decisions are locked. There are **0 blocking `OPEN_DECISION` items** for this workstream.

| ID | Decision | Locked outcome | Status |
|---|---|---|---|
| OD-01 | Secondary categories in MVP | Exactly one active primary category; secondary categories are FUTURE. | LOCKED |
| OD-02 | Services | Owner-defined service names are supported in MVP, separate from categories; service descriptions and a controlled service taxonomy are FUTURE. | LOCKED |
| OD-03 | Tags | Excluded from MVP; controlled attributes may return later. | LOCKED |
| OD-04 | Business contact email | OPTIONAL_MVP, hidden by default, and may be made public explicitly by the owner; distinct from auth/login email. | LOCKED |
| OD-05 | Media | Logo and cover are OPTIONAL_MVP; gallery is FUTURE. | LOCKED |
| OD-06 | Service areas | Named service-area locations are supported in MVP; service radius is FUTURE. | LOCKED |
| OD-07 | Verification before publication | Verification is not required for trusted Buzl-created/Buzl-client listings; publication and verification remain independent. | LOCKED |
| OD-08 | External users | External self-service publishing is feature-gated initially; launch serves Buzl admins and Buzl clients/members. | LOCKED |
| OD-09 | Minimum publishable record | The approved requirements below govern publishability. | LOCKED |
| OD-10 | Authentication | Email + password is the MVP method; magic link and social auth may come later. | LOCKED |
| OD-11 | Geography | India-first UX with a globally extensible conceptual model; retain country and country code. | LOCKED |
| OD-12 | Service-area private address | A pure service-area business needs no private or public street address to publish; never invent a fake storefront address. | LOCKED |

## 25. Business Listing Completeness Levels

- **Level 1 — Minimum Citation Listing:** approved minimum publishable fields only.
- **Level 2 — Complete Business Profile:** Level 1 plus useful enrichment: description, services, hours, website, logo, and optional business contact email.
- **Level 3 — Enhanced Profile:** Level 2 plus cover image, social profiles, and future enhancements.

These are profile-completeness levels, not paid plans.

## 26. Approved Minimum Publishable Record

### System / internal

- stable system-generated slug;
- publication status;
- verification status; and
- normalized primary phone.

### Business data

- canonical business name;
- primary phone;
- one active primary category; and
- location mode.

### Storefront

- public structured address;
- locality/city as appropriate;
- state;
- country;
- postal/PIN code where applicable; and
- public map location.

### Service area

- city;
- state;
- country; and
- at least one named service area.

Not required: a public street address, private street address, or service radius. A private physical address may be introduced later for verification if needed.

### Hybrid

- storefront requirements; and
- at least one named service area.

### Optional enrichment

Description, website, business contact email, hours, services, logo, cover image, social profiles, and year established are not required to publish.

## 27. Phase 2 Follow-Up Dependencies

- User journeys: use the locked P2.1 field contract and launch boundaries.
- Database schema: define every internal/derived field and the later PostGIS representation; no SQL or migration is authorized here.
- RLS matrix: define owner/admin edit rules and sensitive-field visibility.
- Verification/duplicates: define evidence/method details and badge policy.
- Taxonomy/locations: define seed/governance details and location representation.
- Routes/SEO: define exact routes, metadata, schema, and publish/indexability policy.
- Maps provider: provider selection remains a separate Phase 2 workstream.

## 28. Approval Checklist

- [x] Field classifications approved.
- [x] OD-01 through OD-12 resolved.
- [x] Minimum publishable record approved.
- [x] No independently editable SEO duplicate of canonical NAP.
- [x] Publication and verification remain separate.
- [x] Service-area privacy supported.
- [x] No map provider selected.
- [x] No SQL/RLS/application implementation authorized.
