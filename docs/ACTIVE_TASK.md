# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `BUSINESS-PROFILE-EXPANSION` |
| Task Name | Business Profile Expansion Implementation |
| Status | **COMPLETE** |
| Current Agent | `antigravity` |
| Started From Commit | `b6edbc511bcf7047913cf673e44ca6469bfd648b` |
| Latest Commit | `b6edbc511bcf7047913cf673e44ca6469bfd648b` |
| Branch | `feature/business-profile-expansion` |
| Started At | 2026-09-17T18:29:00+05:30 |
| Last Updated | 2026-09-17T18:45:00+05:30 |

## Objective

Implement the approved business profile additions from the Boss review:
1. Services: name + description, max 20 per business, ordering, DB-side limit enforcement.
2. Products: name, description, image, max 20 per business, ordering, DB-side limit enforcement.
3. Gallery: Supabase Storage for images, PostgreSQL metadata, display order, upload/delete, no count limit, RLS.
4. Logo & Cover: integrate with media architecture, distinct roles (logo, cover, gallery).
5. Google Business Profile URL: collected, validated external URL, stored separately from place_id, displayed as "View on Google".
6. Business Create/Edit UX: multi-section updates supporting all above features, preview, public display.

## Allowed Files

- `supabase/migrations/*`
- `supabase/tests/*`
- `src/lib/*`
- `src/components/*`
- `src/app/*`
- `scripts/*`
- `docs/ACTIVE_TASK.md`
- `docs/CURRENT_STATE.md`

## Completed Work

- Merged `docs/boss-review-scope-update` into `main` and pushed to `origin/main`.
- Created feature branch `feature/business-profile-expansion`.
- Database migration `20260917190000_business_profile_expansion.sql`:
  - Added `service_description` to `business_services` and trigger `trg_enforce_business_services_limit` (max 20).
  - Created `business_products` table, trigger `trg_enforce_business_products_limit` (max 20), prevent-reassignment trigger, and RLS policies.
  - Updated `business_media` with partial unique index for singleton logo and cover, while gallery permits multiple items with captions and sort orders.
  - Added `google_business_profile_url` to `businesses` with `^https?://` constraint and granted update permissions to authenticated role.
  - Configured `business-media` bucket with 5MB max file size, MIME whitelist, and RLS policies.
  - Updated `get_published_business_by_slug` to project GBP URL, service descriptions, products, and media with privacy protections.
- Runtime database tests (`supabase/tests/business_profile_expansion_runtime.sql`): 20 pgTAP tests verifying 20-service limit, 20-product limit, logo/cover uniqueness, gallery multiplicity, owner RLS isolation, and public projection (26/26 tests passing).
- Media server actions (`src/lib/media-actions.ts`) & client/server utilities (`src/lib/media-utils.ts`): upload, delete, reorder gallery, getMediaPublicUrl.
- Business server actions (`src/lib/business-actions.ts`): updated `createDraftFromImport`, `createBusiness`, and `updateBusiness` to validate and persist services, products, media metadata, and GBP URL.
- Public directory layer (`src/lib/public-directory.ts`): updated types and mapper for expanded profile fields.
- Edit Business page (`src/app/dashboard/businesses/[id]/edit/page.tsx`): fetches services with descriptions, products, and media.
- Public listing page (`src/app/business/[slug]/page.tsx`): renders cover photo banner, logo avatar, "View on Google" button, service descriptions, products section, and photo gallery.
- Business Form (`src/components/business/BusinessForm.tsx`): updated to 8 structured steps with live media upload, gallery management, product management, and GBP URL.
- Business Preview Card (`src/components/business/BusinessPreviewCard.tsx`): rendered cover, logo, GBP URL, service descriptions, products, and gallery preview.
- Quality checks: `npm run lint` (0 errors), `npm run build` (0 errors, 21 pages generated).
- Independent security review: PASS across all 6 criteria.

## Remaining Work

- None. Ready for review and commit.

## Checks / Tests

- Database tests: PASS (4/4 test files, 26/26 tests)
- Lint: PASS (0 errors)
- Build: PASS (0 errors)
- Security Review: PASS (6/6 items)

## Known Issues

- None

## Next Exact Action

Commit changes on branch `feature/business-profile-expansion`.

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
