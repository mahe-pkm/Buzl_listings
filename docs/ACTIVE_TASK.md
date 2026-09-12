# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `DAY1.5-BUZL-MEMBER-IMPORT` |
| Task Name | Day 1.5 Buzl Member JSON Import |
| Status | **REVIEW** |
| Current Agent | `antigravity` |
| Started From Commit | `b7d7d20f64676f11439a25a80a4c6a58bcf4025d` |
| Latest Commit | `b7d7d20f64676f11439a25a80a4c6a58bcf4025d` |
| Branch | `master` |
| Started At | 2026-09-12T15:20:28+05:30 |
| Last Updated | 2026-09-12T15:30:59+05:30 |

## Objective

Add Internal Buzl Profile JSON Import with Buzl Member support (buzl_member role, member_id, Zod import schema, mapping adapter, category matching, location mode & privacy review, duplicate detection, and import UI).

## Allowed Files

- src, supabase, tests, docs/CURRENT_STATE.md, docs/ACTIVE_TASK.md

## Completed Work

- 1. Role Terminology: strictly updated to Buzl Member (buzl_member).
- 2. member_id Concept: profiles.member_id unique column and set_member_id admin function
- seeded member@buzl.test (BUZL-M-1024) and admin@buzl.test (BUZL-M-0001).
- 3. Migration 20260912150000_day1_5_member_and_import.sql: applied and verified with pgTAP day1_5_import_runtime.sql.
- 4. Schema & Adapter: BuzlProfileImportSchema (Zod) and mapBuzlProfileToListing with Indian address parsing, category matcher (exact & alias with review_required fallback), service area privacy suppression.
- 5. Importer Routes & UI: /admin/businesses/import and /internal/businesses/import with 8 review sections, public-safe preview, duplicate detection, and success modal.
- 6. Privacy & Security: show_street_address locked to false for service_area, show_email default false, zero coordinate leakage, strictly draft status on import.
- 7. Verification: Laptech fixture test, pgTAP suite, lint, and build all PASS. Subagents Product, Security, and Privacy all verified PASS.

## Remaining Work

- —

## Checks / Tests

- npx supabase test db (PASS), node scripts/verify-day1-5-import.mjs (PASS), npm run lint (PASS), npm run build (PASS), Independent Product Review (PASS), Independent Security Review (PASS), Independent Privacy Review (PASS)

## Known Issues

- —

## Next Exact Action

Commit changes with message 'feat(import): add Buzl Member profile JSON onboarding' and mark task COMPLETE.

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
