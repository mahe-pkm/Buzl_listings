# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `BUSINESS-PROFILE-EXPANSION-DEPLOY` |
| Task Name | Business Profile Expansion Staging Deployment |
| Status | **COMPLETE** |
| Current Agent | `antigravity` |
| Started From Commit | `b6edbc511bcf7047913cf673e44ca6469bfd648b` |
| Latest Commit | `b656802f81a4e6d9cc8e8c61daa288a280701149` |
| Branch | `main` |
| Started At | 2026-09-17T18:29:00+05:30 |
| Last Updated | 2026-09-17T19:25:00+05:30 |

## Objective

Implement, integrate, and deploy to staging the approved business profile additions from the Boss review:
1. Services: name + description, max 20 per business, ordering, DB-side limit enforcement.
2. Products: name, description, image, max 20 per business, ordering, DB-side limit enforcement.
3. Gallery: Supabase Storage for images, PostgreSQL metadata, display order, upload/delete, no count limit, RLS.
4. Logo & Cover: integrate with media architecture, distinct roles (logo, cover, gallery).
5. Google Business Profile URL: collected, validated external URL, stored separately from place_id, displayed as "View on Google".
6. Business Create/Edit UX: multi-section updates supporting all above features, preview, public display.
7. Deploy to staging (`https://listing.rclk.in`) and verify end-to-end browser smoke test.

## Allowed Files

- `supabase/migrations/*`
- `supabase/tests/*`
- `src/lib/*`
- `src/components/*`
- `src/app/*`
- `scripts/*`
- `docs/ACTIVE_TASK.md`
- `docs/CURRENT_STATE.md`
- `CHANGELOG.md`

## Completed Work

- Merged `feature/business-profile-expansion` into `main` (`b656802`).
- Pushed `main` to `origin/main`.
- Applied migration `20260917190000_business_profile_expansion.sql` to isolated staging database `buzl-listing-db-1`.
- Built and restarted `buzl-listing-app-1` on staging VPS (`213.210.37.204`).
- Unrelated Supabase stack (`supabase-db`, `supabase-kong`, `buzl-backend-prod`) untouched and verified intact (12-day uptime).
- Automated browser smoke test (`scripts/staging-profile-expansion-smoke.mjs`): 37/37 checks passed.
  - Owner service editing with descriptions & 20 limit
  - Owner product addition with descriptions & 20 limit
  - Logo, Cover, and Gallery upload to Supabase storage
  - Google Business Profile URL persistence and rendering
  - Admin publication workflow
  - Member access isolation
  - Public listing rendering: services, descriptions, products, logo, cover, "View on Google"
  - Privacy protections: no coordinates or street address leaks for service-area listings
  - Staging protection headers: `X-Robots-Tag`, `robots.txt`, empty sitemap, `/api/health` 200 OK.

## Remaining Work

- None.

## Checks / Tests

- Database tests: PASS (4/4 test files, 26/26 tests)
- Lint: PASS (0 errors)
- Build: PASS (0 errors)
- Security Review: PASS (6/6 items)
- Staging Smoke Test: PASS (37/37 checks)

## Known Issues

- None

## Next Exact Action

Task complete. Ready for next instructions.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
