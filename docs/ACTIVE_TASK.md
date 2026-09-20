# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-V2-PHASE-3-BUSINESS-EMAIL-VERIFICATION` |
| Task Name | Auth V2 Phase 3 Business Email Verification |
| Status | **REVIEW** |
| Current Agent | `codex` |
| Started From Commit | `e812e9b54b6332386276cef3d1c6a37e8acb854d` |
| Latest Commit | `a93a53fc72d6b425616fc5081d46f477144b433a` |
| Branch | `codex/auth-v2-phase-3-business-email-verification` |
| Started At | 2026-09-20T18:43:04+05:30 |
| Last Updated | 2026-09-20T18:58:00+05:30 |

## Objective

Implement Business Contact Email verification UX and secure server flow on the approved Auth V2 database foundation, preserving separation from Supabase Auth email and existing listing verification state.

## Allowed Files

- src/components/business/*,src/lib/*,src/app/verify-business-email/*,src/app/api/*,supabase/migrations/*,supabase/tests/*,scripts/*,docs/CURRENT_STATE.md,docs/ACTIVE_TASK.md,CHANGELOG.md,package.json,package-lock.json

## Completed Work

- Implemented Business Contact Email verification end to end on the approved Auth V2 foundation: owner-authorized hashed challenge issuance, 30-minute expiry, replacement/rate limiting, server-only SMTP delivery, opaque-token confirmation page, transactional consume/replay protection, authenticated resend, owner status/readiness/submission UX, distinct internal Listing Verification and Business Email statuses, and confirmed admin-only manual contact-email verification. Updated environment documentation, CURRENT_STATE, and CHANGELOG.

## Remaining Work

- —

## Checks / Tests

- Local migration applied without database reset. pgTAP PASS: 9 files / 111 tests. Business email token/mail transport contract PASS. Invalid-link browser UX PASS. Owner contact status UI PASS. Internal status separation and admin action visibility PASS. Mobile 375/390/430 PASS with no horizontal overflow. Lint PASS with 0 errors and 15 pre-existing warnings. Production build PASS. git diff --check PASS. Staging and production untouched.

## Known Issues

- —

## Next Exact Action

Configure a local/test SMTP inbox using the documented BUSINESS_EMAIL_SMTP_* variables, then run AUTH_V2_PHASE_3_LOCAL_EMAIL_E2E: owner request, real inbox receipt, valid link, verified return state, replay/expiry/email-change checks, and submission confirmation. Do not deploy until that local E2E passes.

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
