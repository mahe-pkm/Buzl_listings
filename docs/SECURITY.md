# Security Requirements

## Baseline

- Supabase RLS enabled for protected data.
- Server-side authorization for sensitive operations.
- Validate and sanitize user input.
- Restrict storage uploads by owner/type/size.
- Prevent unauthorized listing edits.
- Prevent arbitrary role escalation.
- Protect admin routes and admin mutations.
- Rate-limit abuse-prone endpoints where needed.
- Do not expose service-role credentials to the browser.

## Business ownership

A normal user may modify only businesses they are authorized to manage.

## Admin

Admin capability must be derived from trusted server/database state, never from a client-provided value.

## User-generated content

Sanitize rich text or avoid arbitrary HTML during MVP.

## Future

Add audit logging for:

- approval/rejection
- role changes
- ownership changes
- suspensions
- destructive admin actions
