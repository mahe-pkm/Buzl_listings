# Buzl Listing — Design Tokens

**Status:** Baseline tokens derived from extractor + screenshot verification.

Tokens marked `provisional` should be confirmed from the source dashboard CSS when available.

## CSS baseline

```css
:root {
  /* Brand */
  --color-brand-primary: #004AAD;
  --color-brand-primary-hover: #003E91; /* provisional */
  --color-brand-primary-active: #003678; /* provisional */

  /* Text */
  --color-text-primary: #2A3547;
  --color-text-secondary: #5D6776; /* provisional */
  --color-text-muted: #7D8795; /* provisional */
  --color-text-inverse: #FFFFFF;

  /* Surfaces */
  --color-surface-page: #FFFFFF;
  --color-surface-raised: #FFFFFF;
  --color-surface-muted: #F2F5FA;
  --color-surface-card-subtle: #F7F7F7;
  --color-surface-action: #EAEFF4;

  /* Borders */
  --color-border-default: #DCE2E8; /* provisional */
  --color-border-strong: #C8D0DA; /* provisional */
  --color-border-brand: #004AAD;

  /* Status */
  --color-success: #087C3C; /* visually derived; verify */
  --color-success-soft: #E3F2EA; /* provisional */
  --color-info: #4E9BE8; /* provisional */
  --color-info-soft: #ECF4FF;
  --color-warning: #D99B18; /* provisional */
  --color-warning-soft: #FFF6DF; /* provisional */
  --color-danger: #E36B5D; /* provisional */
  --color-danger-soft: #FDECEE; /* provisional */

  /* Type */
  --font-family-sans: "Avantt", "Inter", "Segoe UI", Arial, sans-serif;

  --font-size-xs: 12px;
  --font-size-sm: 13.333px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  --font-size-4xl: 28px;

  --line-height-body: 1.5;
  --line-height-heading: 1.25;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Radius */
  --radius-sm: 7px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 999px;

  /* Motion */
  --duration-instant: 150ms;
  --duration-fast: 200ms;
  --duration-normal: 250ms;
  --duration-slow: 300ms;

  /* Shadow */
  --shadow-floating: 0 8px 24px rgba(149, 157, 165, 0.20);
}
```

## Why the spacing scale differs from the raw extractor

The extractor reported many 1–6 px values because it sampled rendered CSS values rather than identifying a useful product spacing system.

For implementation, use a practical 4 px-based semantic scale.

One-off pixel values may still exist for:

- borders
- optical icon alignment
- table separators

but layout spacing should use semantic spacing tokens.

## Font rule

The existing extraction exposes a generated runtime alias (`__avantt_90bbe1`).

Do not copy that alias into application CSS.

Use the actual Avantt family/source once confirmed from the existing Buzl codebase.

## Token governance

- Components must consume semantic tokens.
- Raw hex values should not be scattered across components.
- New token additions should be documented here.
- Status colors must always be paired with text/icon meaning.
- Public listing and dashboard surfaces must share the same brand tokens.
