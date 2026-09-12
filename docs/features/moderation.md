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

## Admin capabilities later

- review queue
- approve
- reject with reason
- suspend
- detect possible duplicates
- restore/archive
- view owner and change history

External public registrations should not automatically receive trusted status without an explicit policy.
