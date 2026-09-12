# Feature — Search

## MVP search dimensions

- business name
- category
- service
- tag
- location

## Architecture

Start with PostgreSQL-backed search/filtering:

- PostgreSQL full-text search for business names, categories, services, tags, and descriptions
- `pg_trgm` for business-name and address typo tolerance
- GIN indexes for text search
- PostGIS for future distance/proximity queries

Use weighted search fields, prioritizing business name, then category/services, then tags and description. Revisit language configuration when real Tamil or other multilingual content exists; do not add multilingual search infrastructure prematurely.

## Duplicate candidate support

Search capabilities must support duplicate review using normalized phone/domain and legitimate external/Buzl IDs, then name/address/postal-code/coordinate context and trigram similarity. Fuzzy matches are review candidates, never automatic merges.

## Do not add yet

- Elasticsearch/OpenSearch/Algolia
- complex ranking AI
- paid placement ranking logic

## Indexation boundary

Search and facet URLs are user-discovery tools, not automatically indexable SEO landing pages. Only explicitly approved category, location, and category-plus-location pages may be indexable.

Add specialized search infrastructure only when actual scale/quality requirements justify it.
