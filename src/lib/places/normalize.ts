import { NormalizedPlaceDetails } from './types';

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: {
    location?: {
      lat: number | (() => number);
      lng: number | (() => number);
    };
  };
}

/**
 * Normalizes a Google Places API response into a standard internal NormalizedPlaceDetails object.
 * Designed to handle both Indian and global international address structures cleanly.
 */
export function normalizeGooglePlaceDetails(
  place: GooglePlaceResult,
  fallbackPlaceId?: string
): NormalizedPlaceDetails | null {
  const placeId = place.place_id || fallbackPlaceId;
  if (!placeId) {
    return null;
  }

  // Extract coordinates safely
  let lat = 0;
  let lng = 0;
  if (place.geometry?.location) {
    const rawLat = place.geometry.location.lat;
    const rawLng = place.geometry.location.lng;
    lat = typeof rawLat === 'function' ? rawLat() : Number(rawLat);
    lng = typeof rawLng === 'function' ? rawLng() : Number(rawLng);
  }

  if (isNaN(lat) || isNaN(lng)) {
    lat = 0;
    lng = 0;
  }

  const components = place.address_components || [];

  const getComponent = (type: string, useShort = false): string => {
    const comp = components.find((c) => c.types.includes(type));
    if (!comp) return '';
    return (useShort ? comp.short_name : comp.long_name).trim();
  };

  const streetNumber = getComponent('street_number');
  const route = getComponent('route');
  const subpremise = getComponent('subpremise');
  const premise = getComponent('premise');
  const sublocality2 = getComponent('sublocality_level_2');
  const sublocality1 = getComponent('sublocality_level_1');
  const sublocality = getComponent('sublocality');
  const neighborhood = getComponent('neighborhood');
  const locality = getComponent('locality');
  const postalTown = getComponent('postal_town');
  const district = getComponent('administrative_area_level_2');
  const state = getComponent('administrative_area_level_1');
  const country = getComponent('country');
  const countryCode = getComponent('country', true) || 'IN';
  const postalCode = getComponent('postal_code');

  // Address Line 1 resolution:
  // e.g. "123 Main Street" or "Premise, Street"
  let addressLine1 = '';
  if (streetNumber && route) {
    addressLine1 = `${streetNumber} ${route}`;
  } else if (route) {
    addressLine1 = route;
  } else if (premise) {
    addressLine1 = premise;
  } else if (sublocality1) {
    addressLine1 = sublocality1;
  } else if (place.name && place.name !== locality && place.name !== state) {
    addressLine1 = place.name;
  } else {
    // Fallback: take first segment of formatted address
    const firstSegment = (place.formatted_address || '').split(',')[0]?.trim();
    addressLine1 = firstSegment || 'Location Address';
  }

  // Address Line 2 resolution: suite, floor, premise if not in line 1
  let addressLine2: string | null = null;
  if (subpremise) {
    addressLine2 = `Suite/Unit ${subpremise}`;
  } else if (premise && addressLine1 !== premise) {
    addressLine2 = premise;
  }

  // Locality resolution (neighborhood / sublocality):
  const resolvedLocality =
    sublocality1 ||
    sublocality ||
    sublocality2 ||
    neighborhood ||
    locality ||
    district ||
    '';

  // City resolution:
  // In India and UK, sometimes locality is empty and postal_town or district holds the city name
  const resolvedCity =
    locality ||
    postalTown ||
    district ||
    sublocality1 ||
    state ||
    '';

  const resolvedState = state || district || resolvedCity;
  const resolvedCountry = country || 'India';
  const resolvedPostalCode = postalCode || '';
  const placeName = place.name?.trim() || addressLine1;
  const formattedAddress = place.formatted_address?.trim() || `${addressLine1}, ${resolvedCity}, ${resolvedState}`;

  return {
    place_id: placeId,
    name: placeName,
    formatted_address: formattedAddress,
    address_line_1: addressLine1.slice(0, 160),
    address_line_2: addressLine2 ? addressLine2.slice(0, 160) : null,
    locality: resolvedLocality.slice(0, 100),
    city: resolvedCity.slice(0, 100),
    district: district ? district.slice(0, 100) : null,
    state: resolvedState.slice(0, 100),
    postal_code: resolvedPostalCode.slice(0, 20),
    country: resolvedCountry.slice(0, 100),
    country_code: countryCode.toUpperCase().slice(0, 2),
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
  };
}
