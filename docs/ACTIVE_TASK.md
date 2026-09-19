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
| Latest Commit | `1517c71f0df2271793baadc0ee8a89705d7078e6` |
| Branch | `feature/whatsapp-otp-meta-live` |
| Started At | 2026-09-19T19:40:22+05:30 |
| Last Updated | 2026-09-19T20:11:36+05:30 |

## Objective

Implement the server-only Supabase-generated phone OTP delivery path through a verified Send SMS Auth Hook and Meta WhatsApp Cloud API, preserving Supabase as the sole OTP, identity, verification, and session authority. Do not deploy production or enable staging UI until a controlled live end-to-end test passes.

## Allowed Files

- src/lib/whatsapp/*, src/app/api/internal/auth-hooks/*, src/app/login/page.tsx, src/app/signup/page.tsx, scripts/browser-smoke-test-whatsapp-otp.mjs, scripts/verify-whatsapp-meta-provider.mjs, supabase/config.toml, compose*.yml, docker*.yml, .env.example, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- Performed read-only Meta Graph metadata queries only. The configured WABA returned one exact buzl_listing_otp record: ID 1068025066202313, APPROVED, language en, category AUTHENTICATION. The configured phone number ID is listed under the same WABA.

## Remaining Work

- Operator must manually change META_WHATSAPP_TEMPLATE_LANGUAGE in ignored .env.local from en_US to en. After manual confirmation and explicit authorization, run at most one new controlled direct provider send. Do not begin Supabase OTP until direct delivery and operator receipt confirmation pass.

## Checks / Tests

- Template metadata query HTTP 200
- exact template found
- status APPROVED
- category AUTHENTICATION
- configured WABA match PASS
- phone number/template WABA relationship PASS
- no message send executed
- no secrets or phone numbers printed
- no environment file modified.

## Known Issues

- Language mismatch only: configured en_US, Meta API record en. Automatic environment modification and automatic resend are prohibited.

## Next Exact Action

Operator manually edits `.env.local` so META_WHATSAPP_TEMPLATE_LANGUAGE=en, confirms it is saved, and explicitly requests one controlled retry.

## Handoff Notes

Paused for operator configuration correction. Meta API reports template language en while local configuration requires en_US, explaining the 132001 template-not-found rejection.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
