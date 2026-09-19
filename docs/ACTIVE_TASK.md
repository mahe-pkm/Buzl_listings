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
| Latest Commit | `0ea91faa9c349d176fe739b3e3b7c737aca60768` |
| Branch | `feature/whatsapp-otp-meta-live` |
| Started At | 2026-09-19T19:40:22+05:30 |
| Last Updated | 2026-09-19T20:08:26+05:30 |

## Objective

Implement the server-only Supabase-generated phone OTP delivery path through a verified Send SMS Auth Hook and Meta WhatsApp Cloud API, preserving Supabase as the sole OTP, identity, verification, and session authority. Do not deploy production or enable staging UI until a controlled live end-to-end test passes.

## Allowed Files

- src/lib/whatsapp/*, src/app/api/internal/auth-hooks/*, src/app/login/page.tsx, src/app/signup/page.tsx, scripts/browser-smoke-test-whatsapp-otp.mjs, scripts/verify-whatsapp-meta-provider.mjs, supabase/config.toml, compose*.yml, docker*.yml, .env.example, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- Checkpointed the @next/env live-test loader at 0ea91fa and executed exactly one controlled direct Meta provider request. All eight required variable names were READY. Offline provider, template mapping, Standard Webhooks verification, lint, build, and diff checks passed.

## Remaining Work

- Resolve the Meta template delivery rejection before any further send. After operator validates the configured WhatsApp Business Account, phone number ID, exact active template name buzl_listing_otp, and en_US language, explicitly authorize one new controlled send. Only after direct delivery passes may the Supabase phone OTP flow begin.

## Checks / Tests

- Working tree was clean before the single send. One live request only. Meta returned HTTP 404, error code 132001, no error subcode. No token, recipient, OTP, or request payload was printed. No Supabase OTP, UI enablement, deployment, staging change, or production change occurred.

## Known Issues

- Meta provider rejected the Authentication template request. Safe diagnosis is a configured-template availability or identity mismatch
- exact correction requires operator review in Meta Business/WhatsApp Manager.

## Next Exact Action

Operator checks the template is active and available as buzl_listing_otp in en_US for the configured WABA/phone number, then explicitly requests a second controlled provider test if corrected.

## Handoff Notes

Direct Meta delivery gate failed: HTTP 404, Meta error code 132001. Automatic retry is prohibited.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
