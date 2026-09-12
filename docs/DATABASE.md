# Database — Preliminary Model

This file is a starting point only. Final schema must be locked after Phase 1 research.

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
- owner_id
- name
- slug
- description
- email
- phone
- alternate_phone
- whatsapp
- website
- logo_url
- cover_url
- status
- primary_category_id
- latitude
- longitude
- created_at
- updated_at
- published_at

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
- postal_code
- latitude
- longitude

### categories

- id
- parent_id
- name
- slug
- description
- status

### tags

- id
- name
- slug

### business_tags

- business_id
- tag_id

### services

- id
- business_id
- name
- slug
- description

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

## Important database rules

- Preserve exact NAP values.
- Add uniqueness/index rules intentionally.
- Use explicit listing status values.
- Use RLS from the beginning.
- Never rely on client-supplied role/ownership values.
