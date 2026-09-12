# Buzl Listing

**Version:** 0.1.0
**Status:** local MVP baseline verified; remote staging infrastructure is not configured.

Buzl Listing is a Next.js and Supabase business-directory MVP. It supports three listing modes (storefront, service-area, and hybrid), role-gated business management, internal Buzl profile imports, moderation, and a privacy-first public directory.

The current verified baseline is commit `3a97d7a`. It includes the Day 1 business workflow, Day 1.5 Buzl Member importer, Day 2 directory/SEO work, browser verification, and release-staging safeguards.

## What is included

- Email/password Supabase Auth with `admin`, `buzl_member`, and `business_owner` roles.
- Owner dashboard, assignment-aware business CRUD, validation, public-safe preview, and pending submission flow.
- Admin listing directory with publication, suspension, and verification controls.
- Internal Buzl Profile JSON importer with provenance, category review, duplicate warnings, and service-area privacy protections.
- Public business pages, search, category pages, location pages, approved category/location combinations, canonical redirects, JSON-LD, sitemap, and robots controls.
- PostgreSQL full-text search, `pg_trgm`, PostGIS-ready fields, migration-managed schema, and row-level security.
- Staging controls that enforce `noindex`, `nofollow`, `noarchive`, a disallow-all `robots.txt`, and an empty sitemap.

## Technology

| Area | Implementation |
| --- | --- |
| Application | Next.js 16.3.5, App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 and the tracked Buzl design tokens |
| Database | PostgreSQL via Supabase |
| Geospatial | PostGIS |
| Flexible source payloads | PostgreSQL JSONB |
| Authentication | Supabase Auth |
| Media/file storage | Supabase Storage |
| Search | PostgreSQL FTS and `pg_trgm` |
| Validation | Zod |
| Testing | Playwright browser smoke checks, Node verification scripts, Supabase/pgTAP database tests |

PostgreSQL remains the canonical system of record. Flexible imported/source payloads should use JSONB where needed. MongoDB is not currently required and may only be introduced through a future explicit architecture decision.

## Prerequisites

- Node.js 20+ and npm.
- Docker Desktop, for local Supabase.
- Supabase CLI, for starting the local stack, running migrations, and database tests.

## Local setup

1. Install JavaScript dependencies.

   ```bash
   npm ci
   ```

2. Start the repository-specific local Supabase stack.

   ```bash
   npx supabase start
   ```

   The local API is configured on `http://127.0.0.1:54321`; PostgreSQL uses port `54330`. Do not point local development at a remote staging or production project.

3. Create an untracked `.env.local` with local values obtained from `npx supabase status`.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_IS_STAGING=false
   ```

   Never commit `.env.local`, service-role keys, deployment tokens, or account passwords. The repository's [`.env.example`](.env.example) documents the separate staging-only variable names.

4. Apply the complete local schema and seed data when starting from an empty local database.

   ```bash
   npx supabase db reset
   ```

   This resets the **local** database. Do not use this command against a remote project.

5. Run the app.

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Produce a production build. |
| `npm run start` | Start the production build. |
| `npm run test:smoke` | Run authenticated owner/member/admin browser smoke checks. |
| `npm run test:smoke:public` | Run public-directory browser smoke checks. |
| `node scripts/verify-day1-workflow.mjs` | Run Day 1 workflow verification against local Supabase. |
| `node scripts/verify-day1-5-import.mjs` | Run importer verification against local Supabase. |
| `node scripts/verify-day2-public.mjs` | Run public-directory verification against local Supabase. |
| `npx supabase test db` | Run the database test suite. |

## Application routes

### Public

```text
/
/search
/business/[slug]
/category/[slug]
/location/[slug]
/location/[slug]/[categorySlug]
/sitemap.xml
/robots.txt
```

Plural category/location routes permanently redirect to their singular canonical counterparts. Search is intentionally non-indexable. A category/location combination becomes indexable only when it is explicitly approved in the database.

### Authenticated and internal

```text
/login
/dashboard
/dashboard/businesses
/dashboard/businesses/new
/dashboard/businesses/[id]/edit
/admin/businesses
/admin/businesses/import
```

Anonymous users cannot access protected routes; business owners cannot access the Buzl Member importer.

## Data model and security boundary

The migration files are the authoritative schema source:

1. `supabase/migrations/20260912140000_day1_foundation.sql`
2. `supabase/migrations/20260912150000_day1_5_member_and_import.sql`
3. `supabase/migrations/20260912160000_day2_public_directory.sql`

Core entities include `profiles`, `businesses`, `business_managers`, `categories`, `business_services`, `business_service_areas`, `business_hours`, `business_media`, `slug_history`, and `approved_combination_indexes`.

All operational tables use RLS. Base-table access is revoked from `anon` and `authenticated`; clients use narrowly granted, purpose-specific RPCs. Public RPCs return only published, public-safe data and use bounded inputs/pagination. The public directory must never reveal auth emails, member IDs, import provenance, normalized matching fields, private coordinates, or a service-area street address.

Publication and verification are independent state machines. Only `published` listings appear on public pages, search, discovery, and production sitemap output.

## Staging and deployment

Remote staging has **not** been deployed. It needs a dedicated remote Supabase project, secure test-persona credentials, and hosting authorization.

Use the documented staging environment variables only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_IS_STAGING=true
BUZL_ENV=staging
ALLOW_STAGING_SEED=false
SUPABASE_SERVICE_ROLE_KEY=
STAGING_SUPABASE_PROJECT_REF=
STAGING_ADMIN_EMAIL=
STAGING_ADMIN_PASSWORD=
STAGING_MEMBER_EMAIL=
STAGING_MEMBER_PASSWORD=
STAGING_OWNER_EMAIL=
STAGING_OWNER_PASSWORD=
```

The staging seeder refuses to run unless `BUZL_ENV=staging`, `ALLOW_STAGING_SEED=true`, and the project ref derived from the supplied URL exactly matches `STAGING_SUPABASE_PROJECT_REF`. It never prints credentials.

When staging is enabled, the app adds noindex directives at the HTML and HTTP-header layers, disallows all crawlers through `robots.txt`, and serves an empty sitemap. Production SEO behavior is restored when staging is disabled.

See [docs/REVIEW_PACKAGE.md](docs/REVIEW_PACKAGE.md) for the review checklist and remote deployment prerequisites.

## Project documentation

- [Current project state](docs/CURRENT_STATE.md)
- [MVP Build Contract](docs/specs/MVP_BUILD_CONTRACT.md)
- [Business Field Matrix](docs/specs/BUSINESS_FIELD_MATRIX.md)
- [User Journeys](docs/specs/USER_JOURNEYS.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Technology direction](STACK.md)
- [Agent workflow](WORKFLOW.md)
- [Roadmap](docs/ROADMAP.md)
- [Release notes](CHANGELOG.md)

## Development rules

Read [AGENTS.md](AGENTS.md) before modifying the repository. Keep work atomic, preserve approved decisions, use migrations for schema changes, run relevant checks, update project state after meaningful work, and create a clean Git checkpoint before handing work to another agent.

## Versioning

This repository currently uses version **0.1.0** (`package.json`). The release history is maintained in [CHANGELOG.md](CHANGELOG.md).
