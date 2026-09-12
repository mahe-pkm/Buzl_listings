# Skill — Agent Handoff

Use before moving work between Codex, Antigravity, or another coding agent.

## Procedure

1. Stop at an atomic boundary.
2. Run the relevant checks.
3. Record any failure or incomplete item.
4. Update `docs/CURRENT_STATE.md`.
5. Record new architecture decisions.
6. Commit the checkpoint.
7. Tell the next agent to read:
   - `AGENTS.md`
   - `docs/CURRENT_STATE.md`
   - the one relevant feature/plan file

Do not copy large chat histories between agents unless information is missing from the repository.
