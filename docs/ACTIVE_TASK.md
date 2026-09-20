# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-WHATSAPP-FIRST-V2` |
| Task Name | Buzl Listing Authentication Architecture V2 |
| Status | **RESUMED** |
| Current Agent | `codex` |
| Started From Commit | `8a4f064d74a4b50aecaee6f6f63ee8e6fbd8c083` |
| Latest Commit | `5d59d16388277b98f6d8f479033a6dd2a0a10039` |
| Branch | `codex/auth-v2-phase-2-whatsapp-first` |
| Started At | 2026-09-20T12:31:56+05:30 |
| Last Updated | 2026-09-20T13:17:21+05:30 |

## Objective

Replace the obsolete unknown-phone denial assumption with the approved WhatsApp-first public Business Owner signup architecture; audit existing Supabase/RBAC/schema behavior and produce review-ready documentation only.

## Allowed Files

- docs/AUTH_ARCHITECTURE_V2.md,docs/ACTIVE_TASK.md,docs/CURRENT_STATE.md,CHANGELOG.md

## Completed Work

- Implemented Auth V2 Phase 1 database foundation: onboarding state and self-only completion RPC
- business-contact-email verification timestamp and normalized reset trigger
- private hashed challenge table and service-role-only locked consumption
- admin-only manual verification
- verified-email submission gate with legacy published compatibility
- focused and regression pgTAP coverage. No blind verification backfill.

## Remaining Work

- —

## Checks / Tests

- Architecture checkpoint 45d9c22
- implementation checkpoint 05c72bd. Local migration applied in place without reset. pgTAP PASS: 8 files, 97 tests. Lint PASS with 0 errors/15 existing warnings. Build PASS. Mutation guards PASS. git diff --check PASS. Local artifact found unconfirmed with profile and no business relationship
- not deleted. Staging and production untouched.

## Known Issues

- —

## Next Exact Action

Independent database/security review of migration 20260920130000, RPC grants/RLS, legacy listing compatibility, and 97-test pgTAP evidence. Next gate AUTH_V2_PHASE_1_DB_REVIEW.

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
