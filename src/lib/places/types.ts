// Location and Places Types for Google Places integration

export interface PlaceSuggestion {
  place_id: string;
  primary_text: string;
  secondary_text: string;
  description: string;
  types?: string[];
}

export interface NormalizedPlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  address_line_1: string;
  address_line_2: string | null;
  locality: string;
  city: string;
  district: string | null;
  state: string;
  postal_code: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

export interface PlacesAutocompleteResult {
  success: boolean;
  suggestions: PlaceSuggestion[];
  error?: string;
  errorCode?: 'INVALID_REQUEST' | 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'PROVIDER_ERROR' | 'UNAUTHORIZED';
}

export interface PlacesDetailsResult {
  success: boolean;
  details?: NormalizedPlaceDetails;
  error?: string;
  errorCode?: 'INVALID_REQUEST' | 'NOT_FOUND' | 'NOT_CONFIGURED' | 'PROVIDER_ERROR' | 'UNAUTHORIZED';
}

export interface PlacesProvider {
  name: string;
  isAvailable(): boolean;
  autocomplete(query: string, sessionToken?: string): Promise<PlacesAutocompleteResult>;
  getDetails(placeId: string, sessionToken?: string): Promise<PlacesDetailsResult>;
}
