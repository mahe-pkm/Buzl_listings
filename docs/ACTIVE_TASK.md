# Active Task

> Git is the authoritative project checkpoint. This file is handoff context only.
> This file is maintained by AgentRelay for immediate AI-agent handoff state across sessions.

## Task

| Field | Value |
|---|---|
| Task ID | `AUTH-V2-PHASE-3-BUSINESS-EMAIL-VERIFICATION` |
| Task Name | Auth V2 Phase 3 Business Email Verification |
| Status | **PAUSED** |
| Current Agent | `antigravity` |
| Started From Commit | `e812e9b54b6332386276cef3d1c6a37e8acb854d` |
| Latest Commit | `HEAD` |
| Branch | `codex/auth-v2-phase-3-business-email-verification` |
| Started At | 2026-09-20T18:43:04+05:30 |
| Last Updated | 2026-09-20T20:03:00+05:30 |

## Objective

Implement Business Contact Email verification UX and secure server flow on the approved Auth V2 database foundation, preserving separation from Supabase Auth email and existing listing verification state.

## Allowed Files

- src/components/business/*,src/lib/*,src/app/verify-business-email/*,src/app/api/*,supabase/migrations/*,supabase/tests/*,scripts/*,docs/CURRENT_STATE.md,docs/ACTIVE_TASK.md,CHANGELOG.md,package.json,package-lock.json

## Completed Work

- Fixed Business Contact Email UX: replaced ambiguous "(Optional)" label with "Business Contact Email (Required before submission)".
- Added explicit helper: "You can save this listing as a draft without verifying your email. A verified business email is required before submitting for review."
- Rendered all 4 verification status states in the status indicator box (`Required before submission`, `Verification required`, `Verification email sent`, `Verified`).
- Ensured verification URLs are environment-aware (`NEXT_PUBLIC_SITE_URL` with fallback to `http://localhost:3000` in dev and `https://listing.rclk.in` in staging) with opaque token query parameter only and zero private identifier leakage.
- Audited public email visibility as `OPTIONAL` (guarded by `show_email boolean default false`).
- Audited local mail viewer: Inbucket/Mailpit running at `http://127.0.0.1:54324`.
- Updated test suites, CURRENT_STATE, and CHANGELOG.

## Remaining Work

- Operator execution of real inbox E2E delivery test using configured SMTP credentials (`AUTH_V2_PHASE_3_LOCAL_EMAIL_E2E`).

## Checks / Tests

- Database pgTAP tests: 9 files / 111 tests PASS (100%).
- `npm run test:business-email`: 6 contract checks PASS.
- `node scripts/test-responsive-business-email.mjs`: Responsive checks on 375px, 390px, 430px PASS with no overflow.
- `npm run lint`: PASS (0 errors, 15 pre-existing warnings).
- `npm run build`: PASS (all 21 routes compiled).
- `git diff --check`: PASS.
- Staging and production untouched.

## Known Issues

- —

## Next Exact Action

Configure a local/test SMTP inbox or external credentials, then run AUTH_V2_PHASE_3_LOCAL_EMAIL_E2E: owner request, real inbox receipt, valid link, verified return state, replay/expiry/email-change checks, and submission confirmation. Do not deploy until that local E2E passes.

## Handoff Notes

—

## Agent Handoff Rule

Before another agent continues:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/CURRENT_STATE.md`.
4. Read only the active task's relevant specification files.
5. Verify Git status and latest commit before editing.
