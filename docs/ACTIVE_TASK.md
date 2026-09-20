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
| Latest Commit | `0f48a6de5f205787a571576a33c64b7651252820` |
| Branch | `codex/auth-v2-phase-2-whatsapp-first` |
| Started At | 2026-09-20T12:31:56+05:30 |
| Last Updated | 2026-09-20T18:35:07+05:30 |

## Objective

Replace the obsolete unknown-phone denial assumption with the approved WhatsApp-first public Business Owner signup architecture; audit existing Supabase/RBAC/schema behavior and produce review-ready documentation only.

## Allowed Files

- docs/AUTH_ARCHITECTURE_V2.md,docs/ACTIVE_TASK.md,docs/CURRENT_STATE.md,CHANGELOG.md

## Completed Work

- Re-audited and safely removed the one local unconfirmed phone-only Auth test artifact and cascading profile
- confirmed no business, manager, listing, member, privileged-role, session, or other relevant dependencies. Verified database integrity with 97 pgTAP tests passing. Confirmed the configured test recipient was unknown locally, then requested exactly one genuine Supabase phone OTP through the local WhatsApp UI. The signed Send SMS Hook returned 200 and Meta accepted the message with a message ID.

## Remaining Work

- Operator must confirm WhatsApp receipt and enter the OTP only in the local browser. After successful verification, continue the specified new-account, onboarding, returning-login, identity, email/password regression, security, mobile, lint, and build checks. Do not request another OTP until the explicit returning-user test.

## Checks / Tests

- Local Supabase Auth/database/app healthy
- hook reachability and signed runtime configuration verified
- Meta configuration ready
- deleted Auth user/profile are not found
- unrelated users and business data unchanged
- pgTAP PASS (97 tests)
- pre-request existing Auth user/profile both absent
- one UI OTP request accepted
- Send SMS Hook HTTP 200
- Meta message ID returned
- staging and production untouched.

## Known Issues

- The first browser click was made from 127.0.0.1 and degraded to a plain GET because Next.js client assets were cross-origin blocked
- it did not reach Supabase or Meta and created no Auth user. The one genuine request was then made from http://localhost:3000 and accepted. No retry occurred.

## Next Exact Action

Operator confirms WhatsApp receipt and enters the received OTP only in the already-open local browser, without sharing, logging, or storing the OTP. Then Codex verifies session, UID/profile provisioning, business_owner role, active status, and onboarding redirect.

## Handoff Notes

Paused at the mandatory operator OTP receipt and entry gate. No OTP may be exposed to Codex or verified automatically.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
