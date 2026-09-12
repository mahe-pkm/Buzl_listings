# Feature — Locations

## Proposed hierarchy

```text
Country
  └── State
      └── District
          └── City
              └── Locality
```

## Business address

Store structured address fields separately.

For storefront and hybrid businesses, retain an internal canonical address and independently control whether the exact street address is public. Service-area businesses must not use a fake street address to represent their coverage.

## Coordinates

Store an indexable PostGIS geography point for map display and future proximity search. Keep provider-specific geocoding objects out of the core business record.

## Maps and geocoding

Use provider-neutral map/geocoder interfaces. The provider decision is deferred to Phase 2; the shortlist is MapTiler, LocationIQ, Geoapify, Google Maps Platform, and Mapbox.

Do not use public OpenStreetMap Foundation tile or Nominatim infrastructure as the production backend.

## Future public pages

Conceptual examples:

- `/location/chennai`
- `/location/chennai/digital-marketing`
- `/category/digital-marketing`

Only useful category/location combinations with real listings and unique context are indexable. Exact route naming and thresholds are locked in Phase 2.
