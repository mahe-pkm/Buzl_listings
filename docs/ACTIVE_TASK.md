# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-V2-PHASE-3-BUSINESS-EMAIL-VERIFICATION` |
| Task Name | Auth V2 Phase 3 Business Email Verification |
| Status | **PAUSED_HANDOFF** |
| Current Agent | `antigravity` |
| Started From Commit | `e812e9b54b6332386276cef3d1c6a37e8acb854d` |
| Latest Commit | `d1d986863fb823d94d5a913d44353f8326556305` |
| Branch | `codex/auth-v2-phase-3-business-email-verification` |
| Started At | 2026-09-20T18:43:04+05:30 |
| Last Updated | 2026-09-20T21:30:36+05:30 |

## Objective

Implement Business Contact Email verification UX and secure server flow on the approved Auth V2 database foundation, preserving separation from Supabase Auth email and existing listing verification state.

## Allowed Files

- src/components/business/*,src/lib/*,src/app/verify-business-email/*,src/app/api/*,supabase/migrations/*,supabase/tests/*,scripts/*,docs/CURRENT_STATE.md,docs/ACTIVE_TASK.md,CHANGELOG.md,package.json,package-lock.json

## Completed Work

- Deployed Auth V2 to staging (commit d1d9868): applied pending DB migrations, updated Gotrue phone signup config, mapped WhatsApp and Business Email SMTP environment variables, built and restarted buzl-listing-app-1. Verified health, SEO guards, demo credentials, and active WhatsApp login tabs. Confirmed staging DB has 0 phone users. Opened staging login page in browser.

## Remaining Work

- Verify staging new user creation, onboarding flow, returning login same UID, business email verification, demo regressions, and responsive checks.

## Checks / Tests

- Staging migrations applied cleanly (20260920130000 and 20260920184500), schema verified. Auth V2 phone signup enabled, Gotrue restarted. Next.js app built and running on staging (commit d1d9868). Health check HTTP 200, SEO noindex verified, robots.txt and sitemap safe. Staging demo credentials API HTTP 200. Staging login UI active with WhatsApp as default method. 0 existing phone users on staging. Opened https://listing.rclk.in/login for operator.

## Known Issues

- —

## Next Exact Action

Operator enters phone number on staging login page, receives WhatsApp OTP, and submits in browser.

## Handoff Notes

Awaiting operator live WhatsApp OTP entry on staging

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
