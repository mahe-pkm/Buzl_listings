# Skill — Database Changes

## Rules

- Use version-controlled migrations.
- Do not rely on manual production dashboard edits.
- Add RLS policies with protected tables.
- Add indexes based on query patterns.
- Keep migrations understandable and reversible where practical.
- Avoid destructive migrations without explicit approval.

## Before completion

Verify:

- migration applies locally
- expected constraints exist
- RLS behavior is correct
- owner/admin access is correct
- generated types are refreshed later if the project uses them
