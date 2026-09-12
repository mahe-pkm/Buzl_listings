# Buzl Listing — Design QA Checklist

## Visual consistency

- [ ] Uses `#004AAD` via the primary semantic token, not scattered raw hex values
- [ ] Uses Buzl primary dark text token
- [ ] White/light surfaces dominate; no accidental black base surface
- [ ] Table headers use muted pale surface
- [ ] Standard controls use the shared radius family
- [ ] Status indicators use pill treatment consistently
- [ ] Icon family is consistent
- [ ] Public pages feel like Buzl without copying admin density

## Typography

- [ ] Uses approved Avantt source when available
- [ ] Does not hard-code generated `__avantt_*` aliases
- [ ] Table/body density matches product style
- [ ] Heading hierarchy is semantic

## Components

- [ ] Primary and secondary buttons have documented states
- [ ] Search/filter toolbar behaves responsively
- [ ] Tables have a narrow-screen strategy
- [ ] Action menus have accessible names
- [ ] Tabs have active and overflow behavior
- [ ] Cards use low elevation and correct surfaces

## Accessibility

- [ ] Keyboard-only workflow works
- [ ] Focus-visible is obvious
- [ ] Color contrast checked
- [ ] Status is not communicated by color alone
- [ ] Form inputs have labels
- [ ] Menu triggers expose accessible names
- [ ] Touch targets are suitable on mobile
- [ ] Reduced motion is respected

## Source fidelity

- [ ] Any new token not present in source is marked/documented
- [ ] Mobile-specific patterns are validated when references arrive
- [ ] Extractor output is not treated as infallible
- [ ] No browser-default hyperlink blue is promoted as a brand color
