# Feature — Locations

**Status:** Phase 1 location architecture locked; provider and seed details pending.

## Location hierarchy

The directory should support a reusable hierarchy conceptually shaped as:

```text
Country
  └── State
      └── District
          └── City
              └── Locality
```

Exact data source/seeding is Phase 2 work.

## Listing location modes

```text
storefront
service_area
hybrid
```

## Structured address

Store address components separately.

Do not encode service area as a fake address.

## Coordinates

Enable PostGIS and retain an indexable canonical geographic point.

Uses:

- map display
- future near-me search
- distance sorting
- duplicate proximity signals

## Address privacy

Street-address visibility is separate from internal storage.

Service-area businesses may keep a private address while publishing service areas.

## Maps/geocoding

Domain/application design must be provider-neutral.

Final provider is deferred to Phase 2.

Shortlist:

- MapTiler
- LocationIQ
- Geoapify
- Google Maps Platform
- Mapbox

## Public discovery

Potential pages include location and selected location+category landing pages.

Exact route patterns and indexation thresholds are Phase 2 decisions.
