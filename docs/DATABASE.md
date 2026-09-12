# Database — Phase 1 Model Direction

This is a decision-locked model direction, not a migration specification. Phase 2 must define exact SQL types, constraints, indexes, RLS policies, and migrations.

## Initial entities

### profiles

- id
- user_id
- full_name
- phone
- avatar_url
- role
- created_at
- updated_at

### businesses

- id
- owner_user_id
- name
- slug
- description
- publication_status
- verification_status
- location_mode (`storefront`, `service_area`, `hybrid`)
- show_street_address
- email
- primary_phone
- primary_phone_normalized
- alternate_phone
- whatsapp_phone
- website_url
- website_domain_normalized
- logo_path
- cover_path
- primary_category_id
- geo_point (PostGIS geography point)
- created_at
- updated_at
- published_at
- verified_at

### business_addresses

- id
- business_id
- address_line_1
- address_line_2
- locality
- city
- district
- state
- country
- country_code
- postal_code
- latitude
- longitude
- is_primary
- is_public
- source
- created_at
- updated_at

### categories

- id
- parent_id
- name
- slug
- description
- status
- sort_order

### tags

- id
- name
- slug

### business_tags

- business_id
- tag_id

### services

- id
- category_id
- name
- slug
- description

### business_services

- business_id
- service_id
- custom_label (optional)

### business_hours

- id
- business_id
- day_of_week
- opens_at
- closes_at
- is_closed

### business_social_links

- id
- business_id
- platform
- url

### locations

Reusable hierarchy for browsing and service areas:

- id
- parent_id
- type (`country`, `state`, `district`, `city`, `locality`)
- name
- slug
- country_code
- state_code (optional)
- geo_point (optional)
- status

### business_service_areas

- id
- business_id
- location_id
- radius_km (optional)

### business_external_ids

- id
- business_id
- provider
- external_id
- external_url
- created_at

### business_slug_history

- id
- business_id
- slug
- created_at

## Required lifecycle concepts

Publication status:

```text
draft | pending | published | rejected | suspended | archived
```

Verification status:

```text
unverified | pending | verified | failed
```

These are independent. The final model must capture the actor and time for sensitive state changes.

## Important database rules

- Preserve exact NAP values.
- Store matching-normalized values separately from user-facing canonical values.
- Add uniqueness, full-text, trigram, and spatial indexes intentionally.
- Flag uncertain duplicates for review; do not auto-merge fuzzy matches.
- Treat the one-to-one business listing as an establishment/service-area unit; do not build multi-branch grouping in MVP.
- Use RLS from the beginning.
- Never rely on client-supplied role/ownership values.
