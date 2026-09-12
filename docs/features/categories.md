# Feature — Categories

## Model

Hierarchical categories.

```text
Category
  └── Subcategory
      └── Business
```

## Requirements

- name
- slug
- parent
- description
- active/inactive state
- optional SEO fields later

## Business relationship

A business has:

- one primary category
- optional additional categories if later approved

## SEO

Category landing pages should be indexable only when they contain useful content/listings and meet the final SEO rules.
