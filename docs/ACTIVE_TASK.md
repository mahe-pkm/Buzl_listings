# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-WHATSAPP-FIRST-V2` |
| Task Name | Buzl Listing Authentication Architecture V2 |
| Status | **PAUSED_HANDOFF** |
| Current Agent | `codex` |
| Started From Commit | `8a4f064d74a4b50aecaee6f6f63ee8e6fbd8c083` |
| Latest Commit | `3c8a40955580aab02b537bcef2afd7b23aacdc76` |
| Branch | `codex/auth-v2-phase-2-whatsapp-first` |
| Started At | 2026-09-20T12:31:56+05:30 |
| Last Updated | 2026-09-20T18:23:18+05:30 |

## Objective

Replace the obsolete unknown-phone denial assumption with the approved WhatsApp-first public Business Owner signup architecture; audit existing Supabase/RBAC/schema behavior and produce review-ready documentation only.

## Allowed Files

- docs/AUTH_ARCHITECTURE_V2.md,docs/ACTIVE_TASK.md,docs/CURRENT_STATE.md,CHANGELOG.md

## Completed Work

- Implemented the local WhatsApp-first public Business Owner flow, E.164 normalization, Supabase OTP request/verification, onboarding-state routing, protected onboarding reuse of the existing business editor, self-only onboarding completion, role guards, and focused automated coverage.

## Remaining Work

- After operator approval, remove only the previously audited safe phone-only local artifact, then run one controlled real unknown-phone WhatsApp OTP E2E. Business-email delivery and optional Auth credential settings remain Phase 3.

## Checks / Tests

- Auth V2 contract PASS
- mocked/no-send browser smoke PASS at 375/390/430
- Email Code and Password request paths preserved
- lint PASS with 15 existing warnings
- build PASS
- mutation guards PASS
- pgTAP PASS 8 files/97 tests
- git diff check PASS. No live OTP, staging, or production change.

## Known Issues

- —

## Next Exact Action

Obtain LOCAL_TEST_ARTIFACT_CLEANUP_APPROVAL before deleting the audited unconfirmed phone-only local user/profile; do not delete or send OTP without approval.

## Handoff Notes

Implementation and automated validation are complete; controlled real E2E is intentionally gated on operator-approved cleanup.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
