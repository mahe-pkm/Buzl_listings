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
| Latest Commit | `98cf25a170ae5e9375b454dd99712ac0aa87cd79` |
| Branch | `feature/whatsapp-otp-meta-live` |
| Started At | 2026-09-19T19:40:22+05:30 |
| Last Updated | 2026-09-19T19:51:16+05:30 |

## Objective

Implement the server-only Supabase-generated phone OTP delivery path through a verified Send SMS Auth Hook and Meta WhatsApp Cloud API, preserving Supabase as the sole OTP, identity, verification, and session authority. Do not deploy production or enable staging UI until a controlled live end-to-end test passes.

## Allowed Files

- src/lib/whatsapp/*, src/app/api/internal/auth-hooks/*, src/app/login/page.tsx, src/app/signup/page.tsx, scripts/browser-smoke-test-whatsapp-otp.mjs, scripts/verify-whatsapp-meta-provider.mjs, supabase/config.toml, compose*.yml, docker*.yml, .env.example, docs/ACTIVE_TASK.md, docs/CURRENT_STATE.md, CHANGELOG.md

## Completed Work

- Implemented and committed the server-only Meta WhatsApp Cloud API delivery adapter, locked Authentication template mapping, signed Supabase Send SMS Auth Hook endpoint, local/self-hosted hook configuration, server-only deployment variable wiring, and offline provider/signature contract tests.

## Remaining Work

- Securely install the seven operator-owned Meta/test-recipient variables plus a generated Send SMS hook signing secret in an ignored local environment
- run one controlled direct template send
- obtain operator receipt confirmation
- run one real Supabase phone OTP request and manual OTP verification
- verify session, profile, account status, RBAC, new-user role, and existing-user reuse
- only then enable and test the WhatsApp login UI and mobile/browser regressions. Staging deployment requires separate approval after local end-to-end PASS.

## Checks / Tests

- Provider contract PASS
- Standard Webhooks verification PASS
- sanitized provider failure PASS
- npm run lint PASS with 0 errors and 15 pre-existing warnings
- npm run build PASS
- npx supabase test db PASS (7 files, 63 tests)
- existing email OTP and password browser flow PASS
- git diff --check PASS
- changed-content credential scan found 0 candidates
- staging and production untouched.

## Known Issues

- Legacy `npm run test:smoke:auth` assumes the old always-visible password form and times out on the tabbed login UI
- the current email-OTP/password browser suite passes. The WhatsApp UI remains intentionally coming-soon pending live backend validation.

## Next Exact Action

Operator securely installs the required values in an ignored local environment (do not paste secrets into chat), then Codex runs `npm run test:whatsapp:provider -- --live` for exactly one direct Meta template delivery and waits for operator receipt confirmation.

## Handoff Notes

Secure live-test gate: required Meta credentials and the approved WhatsApp test recipient are not installed in local or isolated staging environment. No live send, hook trigger, OTP verification, or UI enablement can proceed safely without them.

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
