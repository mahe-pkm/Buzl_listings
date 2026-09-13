# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `STAGING-OWNER-SUBMIT-VERIFY` |
| Task Name | Staging Owner Draft Submit Verification |
| Status | **PAUSED_HANDOFF** |
| Current Agent | `codex` |
| Started From Commit | `15539b91b8b1a67146a2c4d48fe384c74fdaeb1a` |
| Latest Commit | `15539b91b8b1a67146a2c4d48fe384c74fdaeb1a` |
| Branch | `main` |
| Started At | 2026-09-14T02:06:34+05:30 |
| Last Updated | 2026-09-14T02:06:43+05:30 |

## Objective

Verify the live staging Owner draft to submit to pending flow through the real browser UI and confirm publication and visibility boundaries.

## Allowed Files

- docs/ACTIVE_TASK.md, docs/CHANGELOG.md

## Completed Work

- Canonical main at 15539b9 is deployed to staging. Docker packaging, local auth fixtures, staging/production separation, RBAC and account-status enforcement, Admin User Management, public Business Owner signup, Listing Manager moderation/publish, public regression, and staging noindex protections are verified.

## Remaining Work

- One browser-only staging check: Owner draft → submit → pending.

## Checks / Tests

- Canonical main and origin/main both resolve to 15539b9
- working tree was clean before AgentRelay created this handoff record.

## Known Issues

- None recorded.

## Next Exact Action

Verify staging Owner draft → submit → pending through the real browser UI. Confirm Owner cannot publish; Listing Manager/Admin can see pending; anonymous users cannot see pending.

## Handoff Notes

Cross-agent handoff for the remaining real-browser staging verification.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
