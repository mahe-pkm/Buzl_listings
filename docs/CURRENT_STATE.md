# Current Project State

**Phase:** Phase 1 — Research and Decision Lock  
**Status:** Research conclusions accepted; ready for Phase 2 product specification  
**Application code:** Not started  
**Database migrations:** Not started  
**Local Supabase:** Not initialized  
**Design system extraction:** Source-backed baseline documented; live-dashboard validation pending  
**Research:** Complete; raw source material remains local-only in `.research/`

## Completed

- Project vision documented.
- Proposed folder structure defined.
- Multi-agent workflow defined.
- Next.js + Supabase direction documented.
- Citation-first MVP boundary documented.
- Starter feature/specification files created.
- Root documentation, `docs/`, `skills/`, `supabase/`, and empty application placeholder directories verified against the Phase 0 baseline.
- `.research/` and its documented subdirectories verified locally; `.research/` is ignored by Git.
- Git repository initialized and Phase 0 baseline committed.
- Phase 1 research reviewed across competitors, open-source references, local SEO, maps/geocoding, data modeling, search, duplicate handling, and moderation.
- Phase 1 decisions P1-01 through P1-17 recorded in tracked documentation; final map-provider selection remains explicitly deferred to Phase 2.
- Design-system baseline committed separately as `d19c105`.

## Current constraints

- Map provider has not been selected; a provider-neutral boundary is required.
- Exact database schema, SQL constraints, RLS policies, and migrations are not yet specified.
- First authentication credential flow and exact launch moderation policy remain Phase 2 decisions.
- No production hosting decision has been locked.

## Verification

- Phase 0 structure and Git-ignore checks: passed.
- Phase 1 decision documentation review: complete.
- Application code check: passed; only empty placeholder directories exist.
- Automated tests: not applicable; no application or test tooling has been introduced.

## Next exact task

Execute Phase 2 product specification only when explicitly instructed. Lock the exact schema, RLS model, routes, onboarding flow, taxonomy seed, map provider, and moderation policy. Do not scaffold Next.js or Supabase before Phase 2 is accepted.

## Handoff note

Any agent continuing this repository should read `AGENTS.md` and this file before reading broader documentation.
