# Buzl Listing Design Documentation

Read in this order:

1. `DESIGN_SYSTEM.md`
2. `DESIGN_TOKENS.md`
3. `COMPONENT_PATTERNS.md`
4. `LAYOUT_RULES.md`
5. `RESPONSIVE_RULES.md`
6. `DESIGN_QA.md`

Raw extractor output and screenshots should remain under `.research/design/`.

## Coding-agent rule

For normal UI implementation, the agent should read only the files relevant to the current component/page rather than all design material every time.

Example:

```text
Read AGENTS.md, docs/CURRENT_STATE.md,
docs/design/DESIGN_TOKENS.md,
docs/design/COMPONENT_PATTERNS.md,
and the current feature spec.
Implement only the requested UI.
```
