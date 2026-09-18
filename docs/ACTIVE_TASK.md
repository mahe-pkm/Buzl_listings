# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `INTERNAL-DASHBOARD-PHASE-A` |
| Task Name | Internal Dashboard Phase A Navigation & Moderation Queue Discoverability |
| Status | **COMPLETE** |
| Current Agent | `antigravity` |
| Started From Commit | `faf716a9cb37bd4a527f3bf52414e0647080e8d0` |
| Feature Commit | `fcaf7042e58eac471061083470a70abd11f0806a` |
| Merge Commit | `3a4c7a2511412274d90ffdb3caaafbb17242fbea` |
| Main HEAD | `3a4c7a2511412274d90ffdb3caaafbb17242fbea` |
| Staging HEAD | `3a4c7a2511412274d90ffdb3caaafbb17242fbea` |
| Branch | `main` |
| Started At | 2026-09-18T09:40:13+05:30 |
| Last Updated | 2026-09-18T10:20:00+05:30 |

## Objective

Expose Moderation Queue in role-aware navigation with pending-review count badge across Admin and Listing Manager, hide from unauthorized roles, merge to main, deploy to staging VPS, and verify full workflow, security invariants, and indexing guards.

## Allowed Files

- src/components/dashboard/Sidebar.tsx, src/app/dashboard/layout.tsx, src/app/admin/layout.tsx, src/app/review/layout.tsx, src/app/review/businesses/page.tsx, src/lib/business-actions.ts, src/middleware.ts, scripts/browser-smoke-test-internal-navigation.mjs, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- Expose Moderation Queue in role-aware navigation in `Sidebar.tsx` with compact Buzl amber pending count badge (`1-99`, `99+`, hidden on 0).
- Role-aware navigation tailored for Platform Admin (Overview, All Listings, Moderation Queue, Import, Users, Add User), Listing Manager (Overview, Listings, Add Business, Moderation Queue, Import; Users hidden), Onboarding Member (Overview, My Listings, Add Business, Import; Queue/Users hidden), and Business Owner (Overview, My Businesses, Add Business; Internal items hidden).
- Safe server-side pending count helper `getPendingReviewCount()` in `business-actions.ts` querying `publication_status = 'pending'` with `{ count: 'exact', head: true }` (zero row payloads, internal caller protection, safe error logging without credential leakage).
- Review section layout shell `src/app/review/layout.tsx` enforcing authentication and moderation capability server-side with standard sidebar shell.
- Fixed `canEdit` bug in `BusinessTableView.tsx` decoupling edit permissions from deletion authority; explicitly passing edit permission from authenticated context.
- Updated `src/app/review/businesses/page.tsx` with "Moderation Review Queue" title, pending count in subtitle, and explicit moderation permissions.
- Targeted cache revalidation for `/review/businesses` across `transitionPublication`, `setVerification`, `deleteBusiness`, `createBusiness`, `updateBusiness`, and `createDraftFromImport`.
- Feature branch `feature/internal-dashboard-navigation` merged to `main` (`3a4c7a2`) with `--no-ff`.
- Staging container `buzl-listing-app-1` rebuilt and recreated on Hostinger VPS (`213.210.37.204`). Unrelated production and Supabase containers left untouched (12-day uptime intact).
- Verified live on staging (`https://listing.rclk.in`):
  - Admin: Moderation Queue visible with pending badge "4", Users & Import visible, Review Queue accessible.
  - Listing Manager: Moderation Queue visible with pending badge "4", Users hidden, Review Queue accessible, verification/delete hidden, 42 active Edit links functional.
  - Onboarding Member: Moderation Queue & Users strictly hidden; direct `/review/businesses` denied and redirected to `/dashboard`.
  - Business Owner: Moderation Queue, Import & Users strictly hidden; direct `/review/businesses` denied and redirected to `/dashboard`.
  - Unauthenticated direct URL redirected to `/login?redirect=/review/businesses`.
  - Mobile viewports (375px, 390px, 430px): 0 horizontal overflow, drawer navigation functional.
  - Staging indexing guards: `X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow: /`, empty `sitemap.xml`.
- Comprehensive automated Playwright test suite `scripts/browser-smoke-test-internal-navigation.mjs` verifying all 12 suites (100% pass locally and against live staging).
- Verified regressions: `browser-smoke-test-admin-users.mjs` (100%), `browser-smoke-test-business-owner-ux.mjs` (100%), `npx supabase test db` (5 suites, 38 tests pass).

## Remaining Work

- None. Phase A is complete and fully verified on staging.

## Checks / Tests

- `npm run lint`: PASS (0 errors)
- `npm run build`: PASS (all 32 routes compiled and optimized cleanly)
- `git diff --check`: PASS (0 whitespace errors)
- `npx supabase test db`: PASS (5 suites, 38 tests pass)
- `node scripts/browser-smoke-test-internal-navigation.mjs` (local): PASS (12/12 suites pass)
- `node scripts/browser-smoke-test-internal-navigation.mjs` (staging): PASS (12/12 suites pass on https://listing.rclk.in)
- `node scripts/browser-smoke-test-admin-users.mjs`: PASS (9/9 suites pass)
- `node scripts/browser-smoke-test-business-owner-ux.mjs`: PASS (5/5 suites pass)
- Staging Health (`/api/health`): HTTP 200 `{"status":"ok"}`
- Staging Indexing Guards: `X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow /`, empty `sitemap.xml`
- Unrelated Stack Uptime: PASS (12+ days untouched)

## Known Issues

- None.

## Next Exact Action

Task complete. Recommended next task: `CATEGORY-MANAGEMENT` (Phase B per `docs/INTERNAL_DASHBOARD_CAPABILITY_AUDIT.md`).

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
