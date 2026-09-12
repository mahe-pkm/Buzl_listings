# Architecture — Working Draft

## High-level shape

```text
Browser
  ↓
Next.js application
  ↓
Server-side authorization / validation
  ↓
Supabase
  ├── PostgreSQL
  ├── Auth
  └── Storage
```

## Public pages

Public listing/category/location pages should favor server rendering or static optimization to support:

- crawlability
- fast first load
- low client JavaScript
- stable metadata
- structured data

## Authenticated dashboard

Business owners manage their listings from authenticated routes.

## Authorization

UI restrictions are not security boundaries.

Enforce access through:

- server-side authorization
- Supabase RLS
- ownership rules
- explicit admin permissions

## Database changes

All schema changes should be reproducible through version-controlled migrations.

## Future scale

Do not introduce microservices, external search clusters, queues, or distributed infrastructure until observed requirements justify them.
