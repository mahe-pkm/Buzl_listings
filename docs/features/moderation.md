# Feature — Moderation

Moderation should exist in the data model from the beginning, even if Buzl internal listings are initially fast-tracked.

## Lifecycle

```text
draft
  ↓
pending
  ↓
published / rejected
```

Additional states:

- suspended
- archived

Publication status is not verification. Verification uses `unverified`, `pending`, `verified`, and `failed` independently.

## Admin capabilities later

- review queue
- approve
- reject with reason
- suspend
- detect possible duplicates
- restore/archive
- view owner and change history

## Duplicate policy

- Block or require confirmation for high-confidence matches from strong identifiers.
- Send medium-confidence matches to pending review.
- Never auto-merge fuzzy name/address matches.

## Launch policy direction

Buzl-created or trusted-client listings may use a fast path, but the actor and reason must be recorded. External public signups should enter a review path with duplicate, content, and abuse checks. The exact policy is a Phase 2 decision.

External public registrations should not automatically receive trusted status without an explicit policy.
