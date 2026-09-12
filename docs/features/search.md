# Feature — Search

**Status:** Phase 1 search architecture locked.

## MVP search engine

Use PostgreSQL.

Approved capabilities:

- Full Text Search
- `pg_trgm`
- structured filters
- PostGIS when proximity search is required

Do not add Algolia, Elasticsearch, or OpenSearch for MVP.

## Search dimensions

Initial product dimensions:

- business name
- category
- service
- tag if retained in MVP
- location

Future:

- distance / near me
- open now
- verified
- featured

## Ranking direction

Potential weighting:

```text
highest: business name
high: category/services
medium: tags/location
lower: description
```

Exact ranking formula is Phase 2/implementation tuning.

## Fuzzy matching

Use trigram similarity where useful for:

- business names
- addresses
- duplicate detection

## SEO boundary

Internal search/filter states do not automatically become indexable landing pages.

Only explicitly approved category/location landing pages receive SEO treatment.

## Multilingual note

Do not assume English stemming is correct for every future Tamil/Indian-language field.

Keep the design flexible; do not add multilingual search infrastructure until content requires it.
