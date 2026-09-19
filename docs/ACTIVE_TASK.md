# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `WHATSAPP-OTP-META-LIVE` |
| Task Name | WhatsApp OTP Meta Live Integration |
| Status | **IN_PROGRESS** |
| Current Agent | `codex` |
| Started From Commit | `fe13135314e24e547cf148c2b0b80952d1628c42` |
| Latest Commit | `fe13135314e24e547cf148c2b0b80952d1628c42` |
| Branch | `feature/whatsapp-otp-meta-live` |
| Started At | 2026-09-19T19:40:22+05:30 |
| Last Updated | 2026-09-19T19:40:22+05:30 |

## Objective

Implement the server-only Supabase-generated phone OTP delivery path through a verified Send SMS Auth Hook and Meta WhatsApp Cloud API, preserving Supabase as the sole OTP, identity, verification, and session authority. Do not deploy production or enable staging UI until a controlled live end-to-end test passes.

## Allowed Files

- src/lib/whatsapp/*, src/app/api/internal/auth-hooks/*, src/app/login/page.tsx, src/app/signup/page.tsx, scripts/browser-smoke-test-whatsapp-otp.mjs, scripts/verify-whatsapp-meta-provider.mjs, supabase/config.toml, compose*.yml, docker*.yml, .env.example, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- —

## Remaining Work

- —

## Checks / Tests

- —

## Known Issues

- —

## Next Exact Action

—

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
