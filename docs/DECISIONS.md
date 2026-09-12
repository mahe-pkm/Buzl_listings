# Architecture / Product Decisions

Use this file as a lightweight ADR log.

## DEC-001 — Next.js

**Status:** Accepted  
**Decision:** Use Next.js for the application.  
**Reason:** Strong fit for SEO-facing public pages plus authenticated application flows.

## DEC-002 — Supabase

**Status:** Accepted  
**Decision:** Use Supabase for PostgreSQL, Auth, Storage, and RLS.  
**Reason:** Matches the required app model and supports efficient local development.

## DEC-003 — Local Supabase via Docker

**Status:** Accepted  
**Decision:** Use Supabase CLI with Docker Desktop locally.  
**Reason:** Reproducible local testing and migration-driven development.

## DEC-004 — Git as agent handoff memory

**Status:** Accepted  
**Decision:** Git + repository documentation are the persistent state across Codex and Antigravity.  
**Reason:** Avoid dependence on one agent's conversation history.

## DEC-005 — Raw research is not committed

**Status:** Accepted  
**Decision:** Keep exploratory material in `.research/` and ignore it in Git.  
**Reason:** Keep the repository focused while preserving local investigation.

## DEC-006 — Open source strategy

**Status:** Proposed  
**Decision:** Research open-source directories, but prefer owning the Buzl data model and application architecture rather than blindly forking a directory product.  
**Reason:** Citation, SEO, and future Buzl integration requirements are specialized.

## Pending decisions

- map provider
- final styling library / component approach
- production hosting
- route architecture
- final category/location taxonomy
- exact moderation launch behavior
