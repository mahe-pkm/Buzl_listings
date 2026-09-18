# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `LISTING-ID-SYSTEM` |
| Task Name | Permanent Buzl Listing ID System |
| Status | **REVIEW_READY** |
| Current Agent | `antigravity` |
| Started From Commit | `9236892b2ae7ad971f0f3a9aaf08be08cbf69296` |
| Latest Commit | `9236892b2ae7ad971f0f3a9aaf08be08cbf69296` |
| Branch | `feature/listing-id-system` |
| Started At | 2026-09-18T12:59:11+05:30 |
| Last Updated | 2026-09-18T13:50:00+05:30 |

## Objective

Implement permanent human-readable Buzl Listing ID system (BZL-000001) with database sequence, backfill, immutability, UI integration, pgTAP and browser tests.

## Allowed Files

- supabase/migrations/**, supabase/tests/**, src/**, scripts/**, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- Database sequence and constraints implemented
- Database trigger functions to enforce code allocation and immutability
- 63 pgTAP tests added to verify listing ID creation and backfill behavior
- Listing code added to `src/types/business.ts` and `BusinessManagerQueryResult`
- Updated dashboard queries and UI to render the badge
- Updated business form and ManageUserForm to display listing IDs
- Smoke test script created for verification

## Remaining Work

- Playwright smoke test pending local run confirmation
- Final git commit

## Checks / Tests

- TypeScript build passed
- pgTAP tests passed
- ESLint passed

## Known Issues

- None

## Next Exact Action

- Awaiting user review

## Handoff Notes

- Do NOT merge to main, deploy staging, or deploy production per user rules

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
