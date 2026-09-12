# AGENTS.md

This repository is designed to be worked on by multiple AI coding agents, primarily Codex and Google Antigravity.

## Read first

Before changing anything, read:

1. `docs/CURRENT_STATE.md`
2. `PLAN.md`
3. `STACK.md`
4. `WORKFLOW.md`
5. The specific feature or execution-plan file relevant to the task

Do not load every document unless the task requires it.

## Operating rules

- Work on one atomic task at a time.
- Do not invent requirements.
- Do not change the approved stack without recording a decision in `docs/DECISIONS.md`.
- Keep research in `.research/`; move only finalized conclusions into `docs/`.
- Use database migrations for schema changes.
- Do not bypass Supabase RLS or server-side authorization.
- Do not hard-code temporary design values across the app; use centralized design tokens.
- Do not publish invented business data.
- Prefer simple, maintainable solutions over premature infrastructure.
- Public listing pages must remain SEO-friendly, accessible, and fast.
- Run relevant checks before declaring a task complete.
- Update `docs/CURRENT_STATE.md` after meaningful work and before handing off to another agent.

## Handoff requirement

Before switching agents:

1. Finish or clearly stop the current atomic task.
2. Run available tests/checks.
3. Record incomplete work and known issues.
4. Update `docs/CURRENT_STATE.md`.
5. Create a clean Git commit.

Git + repository documentation are the shared project memory.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
