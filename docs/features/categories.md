# Feature — Categories

**Status:** Phase 1 taxonomy strategy locked; Phase 2 seeds/governance pending.

## Decision

Use a curated Buzl hierarchical taxonomy.

```text
Category
  └── Subcategory
      └── Business
```

Do not copy a giant external directory taxonomy wholesale.

## Requirements

Conceptual category fields:

- name
- slug
- parent
- description
- status
- sort order

## Business relationship

A business has one primary category.

Phase 2 decides whether MVP also permits secondary categories.

## Categories vs services

Category:

> What kind of business is this?

Services:

> What does the business offer?

Do not create a new category for every service phrase.

## SEO

Category landing pages may be indexable only under the approved quality/indexation policy.

Phase 2 must define:

- category seed strategy
- category governance
- secondary category support
- category landing-page quality threshold
