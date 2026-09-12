# Buzl Listing — Database Direction

**Status:** Phase 1 conceptual model locked.  
**Important:** This is not the final SQL schema. Phase 2 must lock table/column types, constraints, indexes, RLS, and migrations.

## 1. Database capabilities

Approved foundation:

- PostgreSQL via Supabase
- Row Level Security
- Full Text Search
- `pg_trgm`
- PostGIS

## 2. Core modeling rules

- one public business record = one establishment/service-area listing
- public business identity is separate from account ownership
- publication status is separate from verification status
- citation display values are separate from normalized matching values
- structured address fields are retained
- coordinates are stored geospatially
- category taxonomy is hierarchical and curated
- uncertain duplicates are reviewed, not auto-merged

## 3. `profiles`

Conceptual fields:

```text
id
user_id
full_name
phone
avatar_url
role
created_at
updated_at
```

Final relationship to Supabase `auth.users` is a Phase 2 schema decision.

## 4. `businesses`

Conceptual fields:

```text
id

name
slug
description

publication_status
verification_status

location_mode
show_street_address

primary_category_id

primary_phone
primary_phone_normalized
alternate_phone
whatsapp_phone

email
website_url
website_domain_normalized

logo_path
cover_path

geo_point

created_source

created_at
updated_at
published_at
verified_at
```

### `location_mode`

```text
storefront
service_area
hybrid
```

### `publication_status`

```text
draft
pending
published
rejected
suspended
archived
```

### `verification_status`

```text
unverified
pending
verified
failed
```

Exact PostgreSQL enum/check-table implementation is a Phase 2 decision.

## 5. Ownership / membership

Do not permanently couple the public business row to one immutable owner.

Phase 2 should evaluate a relationship such as:

```text
business_members
- business_id
- user_id
- role
- status
```

This supports:

- Buzl-created unclaimed listings
- later claiming
- multiple managers
- ownership transfer

## 6. `business_addresses`

Conceptual fields:

```text
id
business_id

address_line_1
address_line_2
locality
city
district
state
country
country_code
postal_code

latitude
longitude

is_primary
is_public
source

created_at
updated_at
```

Rules:

- postal/PIN codes are strings, not integers
- service-area listings may keep a private/internal street address
- public address visibility is explicitly controlled

Phase 2 must decide whether the canonical PostGIS point resides on `businesses`, `business_addresses`, or both with a clearly defined source of truth.

## 7. Geography / PostGIS

Use an indexable geographic `POINT` representation for canonical coordinates.

Phase 2 must lock:

- column location
- SRID/type
- spatial index
- coordinate synchronization rules
- distance-query functions

## 8. `categories`

Conceptual:

```text
id
parent_id
name
slug
description
status
sort_order
created_at
updated_at
```

Rules:

- hierarchical
- curated by Buzl
- one primary category per business
- additional categories only if explicitly included in the Phase 2 product spec

## 9. Services

Category and service are different concepts.

Example:

```text
Category: Digital Marketing Agency

Services:
- Local SEO
- Google Ads
- Meta Ads
- Website Development
```

Phase 2 must choose between:

1. controlled reusable `services` + `business_services`, or
2. owner-defined business services for MVP with later normalization.

Do not guess this during implementation.

## 10. Tags

Tags are cross-cutting descriptors, not a substitute for categories.

Conceptual:

```text
tags
business_tags
```

Phase 2 must define whether tags are:

- admin-controlled only, or
- selectable/creatable by business owners

Avoid an unrestricted SEO-spam tag system.

## 11. Business hours

Conceptual:

```text
business_hours
- business_id
- day_of_week
- opens_at
- closes_at
- is_closed
```

Phase 2 should account for:

- multiple intervals in one day
- 24-hour businesses
- temporary/special hours as a future extension

## 12. Social/external links

Conceptual:

```text
business_social_links
- business_id
- platform
- url
```

Only store valid user/Buzl-provided links.

## 13. External identifiers

Recommended conceptual table:

```text
business_external_ids
- business_id
- provider
- external_id
- external_url
- created_at
```

Examples:

- legitimate Google Place ID
- Buzl CRM/client ID
- future integrations

External IDs are references, never Buzl primary keys.

## 14. Slug history

Recommended:

```text
business_slug_history
- business_id
- slug
- created_at
```

Purpose:

- redirect old published slugs
- preserve citation/bookmark value after legitimate name/slug changes

## 15. Service areas

Required conceptually for `service_area` / `hybrid` listings.

Potential model:

```text
business_service_areas
- business_id
- location_id
- radius_km nullable
```

Final structure is a Phase 2 decision.

Do not encode a service area as a fake street address.

## 16. Location taxonomy

Reusable hierarchical location entities should support:

```text
country
state
district
city
locality
```

Potential conceptual table:

```text
locations
- id
- parent_id
- type
- name
- slug
- country_code
- state_code
- geo_point nullable
- status
```

Phase 2 must decide seeding/source strategy.

## 17. Duplicate detection data

Strong normalized signals may include:

- primary phone
- website domain
- legitimate external ID
- internal Buzl business/client ID

Context/fuzzy signals:

- normalized name
- address
- postal code
- city
- PostGIS distance
- trigram similarity

Do not enforce one simplistic uniqueness rule that blocks legitimate chains/branches.

## 18. Database security

Phase 2 must define RLS for every protected table.

Rules already locked:

- users cannot modify arbitrary businesses
- client-provided role/owner claims are untrusted
- admin capability comes from trusted server/database state
- migrations are version-controlled
