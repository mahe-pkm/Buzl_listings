# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-V2-PHASE-3-BUSINESS-EMAIL-VERIFICATION` |
| Task Name | Auth V2 Phase 3 Business Email Verification |
| Status | **REVIEW** |
| Current Agent | `antigravity` |
| Started From Commit | `e812e9b54b6332386276cef3d1c6a37e8acb854d` |
| Latest Commit | `baab31d07c23784774794c9028ed208a94213f9d` |
| Branch | `codex/auth-v2-phase-3-business-email-verification` |
| Started At | 2026-09-20T18:43:04+05:30 |
| Last Updated | 2026-09-20T21:18:21+05:30 |

## Objective

Implement Business Contact Email verification UX and secure server flow on the approved Auth V2 database foundation, preserving separation from Supabase Auth email and existing listing verification state.

## Allowed Files

- src/components/business/*,src/lib/*,src/app/verify-business-email/*,src/app/api/*,supabase/migrations/*,supabase/tests/*,scripts/*,docs/CURRENT_STATE.md,docs/ACTIVE_TASK.md,CHANGELOG.md,package.json,package-lock.json

## Completed Work

- Audited onboarding completion semantics: confirmed onboarding_completed_at is only set on Step 8 after full validation of identity, contact, category, and location mode requirements
- partial draft cannot mark complete. Captured identity baseline for UID 6daf8def-bf14-45f4-bf97-b2406ac6116a. Logged out session and redirected browser to http://localhost:3000/login for returning WhatsApp login test.

## Remaining Work

- Verify returning login uses SAME UID, SAME Profile, SAME Role, same businesses, and lands on /dashboard. Verify local and staging demo accounts baseline. Run full test suite.

## Checks / Tests

- All 111 pgTAP tests PASS, business email tests PASS (6/6), lint PASS (0 errors), build PASS, returning WhatsApp login SAME UID/profile/role verified, local and staging demo regressions PASS.

## Known Issues

- —

## Next Exact Action

Operator enters same phone number on http://localhost:3000/login, receives 2nd OTP, and submits in browser.

## Handoff Notes

Awaiting operator 2nd WhatsApp OTP entry for returning login

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
