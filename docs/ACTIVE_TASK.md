# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `GOOGLE-PLACES-LOCATION` |
| Task Name | Google Places Location Integration |
| Status | **REVIEW_READY** |
| Current Agent | `antigravity` |
| Started From Commit | `c8f67b8aa29c0b3248512d4970903cb32a8649e0` |
| Latest Commit | `c8f67b8aa29c0b3248512d4970903cb32a8649e0` |
| Branch | `feature/google-places-location` |
| Started At | 2026-09-17T19:26:22+05:30 |
| Last Updated | 2026-09-17T19:59:00+05:30 |

## Objective

Replace manual latitude/longitude entry in the Buzl Listing business create/edit UX with Google Places search while preserving coordinates internally for PostGIS/geospatial functionality.

## Scope Boundaries

Included:
- Google Places autocomplete
- Place details lookup
- Normalized address/location mapping
- `place_id` persistence
- Internal latitude/longitude persistence
- Storefront / Hybrid / Service Area support
- Legacy listing compatibility (existing listings without `place_id` remain valid and editable)
- Real Google Places provider integration (server-only)
- Mock provider support for automated tests / local development
- Security & privacy review

Excluded:
- Email OTP (DEC-028)
- WhatsApp OTP (DEC-029)
- Google OAuth (DEC-031)
- Automatic website generation (DEC-032)
- Unrelated business-profile changes
- Production or staging deployment (this task ends at reviewed local implementation)

## Allowed Files

- `src/*`
- `supabase/*`
- `docs/*`
- `scripts/*`
- `.env.example`

## Completed Work

- Preflight verified: Canonical repo confirmed, `main` at `c8f67b8`, branch `feature/google-places-location` created.
- API key safety verification: Checked `GOOGLE_PLACES_API_KEY` (server-only, not logged/exposed, safe mock provider for local/test).
- Project documentation reviewed: `docs/DECISIONS.md` (DEC-027), `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/specs/BUSINESS_FIELD_MATRIX.md`.
- Database schema migration: Created `20260917200000_google_places_location.sql` adding `place_id` column with check constraint, partial index, RLS permissions, and updated `create_business_for_current_user` RPC.
- Provider abstraction layer: Implemented `types.ts`, `normalize.ts`, `google-provider.ts`, `mock-provider.ts`, and `index.ts` with strict production safety guards.
- API proxy routes: Implemented `/api/places/autocomplete` and `/api/places/details` requiring active authenticated accounts with input bounding and validation.
- UI Component: Created `PlacesLocationSearch.tsx` combobox with debounced search, keyboard navigation, session tokens, and accessible ARIA attributes.
- Form integration: Integrated `PlacesLocationSearch` into `BusinessForm.tsx` (Step 6), replaced manual lat/long typing with verified PostGIS badge, and ensured `canonical_name` is never overwritten.
- Server actions & types: Updated `createDraftFromImport`, `createBusiness`, and `updateBusiness` in `src/lib/business-actions.ts` and `Business` / `BusinessFormData` in `src/types/business.ts`.
- Tests & Verification:
  - Database pgTAP tests: `supabase/tests/google_places_location_runtime.sql` (12 tests, PASS: 100%).
  - Verification script: `scripts/verify-google-places-flow.mjs` (PASS: 100%).
  - Playwright browser smoke test: `scripts/browser-smoke-test-places.mjs` (PASS: 100%).
  - Lint: `npm run lint` (PASS: 0 errors).
  - Build: `npm run build` (PASS: Next.js Turbopack build succeeded).
  - Whitespace check: `git diff --check` (PASS).
  - Independent security review: Subagent reviewed all 6 criteria (FINAL VERDICT: PASS).

## Remaining Work

- None (Implementation complete, fully verified, and ready for operator review/handoff).

## Checks / Tests

- Database tests: PASS (`npx supabase test db` - 5 files, 38 tests, 0 failures)
- Lint: PASS (`npm run lint` - 0 errors)
- Build: PASS (`npm run build` - successful Next.js build)
- E2E Integration: PASS (`scripts/verify-google-places-flow.mjs`)
- Browser Smoke: PASS (`scripts/browser-smoke-test-places.mjs`)
- Security Review: PASS (Independent security review completed with 0 critical / 0 high findings)

## Known Issues

- None

## Next Exact Action

1. Await operator review or approved Google Places API key (`GOOGLE_PLACES_API_KEY`).
2. Merge `feature/google-places-location` into `main` when approved.

## Handoff Notes

- Branch: `feature/google-places-location`
- Mock provider is enabled locally via `.env.local` (`GOOGLE_PLACES_MOCK=true`) for deterministic testing.
- Production environment explicitly disallows mock mode (`getPlacesProvider()` throws an error in production if mock is configured).
- Staging safely falls back to `NOT_CONFIGURED` without mock if no API key is provided.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
