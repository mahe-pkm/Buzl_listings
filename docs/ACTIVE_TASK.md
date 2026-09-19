# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `WHATSAPP-OTP-META-LIVE` |
| Task Name | WhatsApp OTP Meta Live Integration |
| Status | **PAUSED_HANDOFF** |
| Current Agent | `codex` |
| Started From Commit | `fe13135314e24e547cf148c2b0b80952d1628c42` |
| Latest Commit | `2520d79a3b9b911f18e51a44265c9330bb2b4f12` |
| Branch | `feature/whatsapp-otp-meta-live` |
| Started At | 2026-09-19T19:40:22+05:30 |
| Last Updated | 2026-09-19T20:29:33+05:30 |

## Objective

Implement the server-only Supabase-generated phone OTP delivery path through a verified Send SMS Auth Hook and Meta WhatsApp Cloud API, preserving Supabase as the sole OTP, identity, verification, and session authority. Do not deploy production or enable staging UI until a controlled live end-to-end test passes.

## Allowed Files

- src/lib/whatsapp/*, src/app/api/internal/auth-hooks/*, src/app/login/page.tsx, src/app/signup/page.tsx, scripts/browser-smoke-test-whatsapp-otp.mjs, scripts/verify-whatsapp-meta-provider.mjs, supabase/config.toml, compose*.yml, docker*.yml, .env.example, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- Configured and verified the local Supabase Auth Send SMS Hook runtime. Phone Auth is enabled, SMS autoconfirm is disabled, hook URI matches the Next.js route, Auth/app Standard Webhooks secrets are configured and match, Supabase CLI loads ignored local env safely, the Auth container can reach the hook endpoint, and valid/missing/invalid signature behavior passed without provider delivery. Direct Meta delivery and operator receipt had already passed.

## Remaining Work

- Request exactly one genuine Supabase-generated phone OTP through the supported Auth client, stop for operator WhatsApp receipt confirmation, then let the operator enter the OTP through the normal application flow. After that verify Supabase session, profile resolution, account status, RBAC, new-user business_owner default or existing-user reuse, and no identity/contact auto-merge. Do not enable the UI or deploy staging until the full flow passes.

## Checks / Tests

- GoTrue v2.196.0
- phone Auth PASS
- Send SMS Hook enabled PASS
- hook URI PASS
- Auth signing secret READY
- app verification secret READY
- secret match PASS
- SMS autoconfirm disabled PASS
- Supabase CLI env resolution PASS
- Auth-container hook reachability PASS
- runtime signature validation PASS
- provider delivery attempted during signature test NO
- lint 0 errors (15 existing warnings)
- 63/63 DB tests PASS
- no OTP requested.

## Known Issues

- Supabase CLI requires the existing local SMS provider compatibility block to be enabled for GOTRUE_EXTERNAL_PHONE_ENABLED=true even though the signed Send SMS Hook replaces provider delivery. Inert local-only provider identifiers and an ignored local token satisfy this runtime requirement.

## Next Exact Action

Explicitly authorize and trigger one genuine Supabase phone OTP request using the configured test recipient, then stop at OPERATOR_CONFIRM_SUPABASE_OTP_RECEIPT.

## Handoff Notes

Runtime configuration gate is complete. Paused before the separately authorized one-OTP delivery gate.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
