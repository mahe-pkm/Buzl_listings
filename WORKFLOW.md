# Human + AI Agent Workflow

## Planning flow

ChatGPT:
- research
- compare approaches
- resolve architecture questions
- prepare concise specifications

Repository docs:
- store accepted decisions
- store implementation scope
- store handoff state

Coding agent:
- implement one clearly scoped task
- test
- document
- commit

## Token-efficient agent usage

Do not ask a coding agent to research the internet, understand the entire product, and implement everything in one prompt.

Preferred prompt pattern:

> Read `AGENTS.md`, `docs/CURRENT_STATE.md`, and the exact feature spec for this task. Implement only Task X. Run the required checks. Update `CURRENT_STATE.md`. Stop.

## Switching Codex → Antigravity

1. Complete the current task if possible.
2. Run checks.
3. Update `docs/CURRENT_STATE.md`.
4. Commit locally.
5. Open the same repository in Antigravity.
6. Tell it to read only:
   - `AGENTS.md`
   - `docs/CURRENT_STATE.md`
   - the relevant spec
7. Continue from the latest Git checkpoint.

## Switching back

Use the same process. The agent should rely on Git and repository docs, not the previous agent's chat history.
