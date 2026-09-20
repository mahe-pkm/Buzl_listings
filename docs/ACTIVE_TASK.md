# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-WHATSAPP-FIRST-V2` |
| Task Name | Buzl Listing Authentication Architecture V2 |
| Status | **REVIEW** |
| Current Agent | `codex` |
| Started From Commit | `8a4f064d74a4b50aecaee6f6f63ee8e6fbd8c083` |
| Latest Commit | `8a4f064d74a4b50aecaee6f6f63ee8e6fbd8c083` |
| Branch | `feature/whatsapp-otp-meta-live` |
| Started At | 2026-09-20T12:31:56+05:30 |
| Last Updated | 2026-09-20T12:32:09+05:30 |

## Objective

Replace the obsolete unknown-phone denial assumption with the approved WhatsApp-first public Business Owner signup architecture; audit existing Supabase/RBAC/schema behavior and produce review-ready documentation only.

## Allowed Files

- docs/AUTH_ARCHITECTURE_V2.md,docs/ACTIVE_TASK.md,docs/CURRENT_STATE.md,CHANGELOG.md

## Completed Work

- Audited current Supabase phone Auth configuration, signed Send SMS Hook, trusted profile/role provisioning, ownership, moderation, and contact-data separation. Documented the approved WhatsApp-first public Business Owner architecture, mandatory business-email verification, same-UID optional Auth email/password, anti-abuse controls, migrations, obsolete assumptions, and implementation phases.

## Remaining Work

- —

## Checks / Tests

- Documentation-only audit. Runtime Auth code, schema, Supabase configuration, staging, and production unchanged. git diff --check passed. Possible local phone-only artifact remains REVIEW_REQUIRED because local Supabase runtime was unavailable
- nothing deleted.

## Known Issues

- —

## Next Exact Action

Independent architecture review passed. Create the architecture checkpoint, then resume this task for the Phase 1 database foundation on a dedicated implementation branch.

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
