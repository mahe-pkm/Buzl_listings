import { PlacesProvider, PlacesAutocompleteResult, PlacesDetailsResult, PlaceSuggestion } from './types';
import { normalizeGooglePlaceDetails } from './normalize';

export class GooglePlacesProvider implements PlacesProvider {
  name = 'google';
  private apiKey: string | null;
  private timeoutMs = 6000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || null;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async autocomplete(query: string, sessionToken?: string): Promise<PlacesAutocompleteResult> {
    if (!this.isAvailable() || !this.apiKey) {
      return {
        success: false,
        suggestions: [],
        error: 'GOOGLE_PLACES_API_KEY is not configured',
        errorCode: 'NOT_CONFIGURED',
      };
    }

    const trimmed = query?.trim() || '';
    if (trimmed.length < 2) {
      return {
        success: true,
        suggestions: [],
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        trimmed
      )}&key=${encodeURIComponent(this.apiKey)}`;

      if (sessionToken?.trim()) {
        url += `&sessiontoken=${encodeURIComponent(sessionToken.trim())}`;
      }

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          suggestions: [],
          error: `Google Places HTTP error: ${res.status}`,
          errorCode: 'PROVIDER_ERROR',
        };
      }

      const data = await res.json();

      if (data.status === 'ZERO_RESULTS') {
        return {
          success: true,
          suggestions: [],
        };
      }

      if (data.status !== 'OK') {
        return {
          success: false,
          suggestions: [],
          error: `Google Places API status: ${data.status}`,
          errorCode: 'PROVIDER_ERROR',
        };
      }

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  types?: string[];
}

      const rawPredictions: GooglePrediction[] = Array.isArray(data.predictions) ? data.predictions.slice(0, 10) : [];
      const suggestions: PlaceSuggestion[] = rawPredictions.map((p: GooglePrediction) => ({
        place_id: p.place_id,
        primary_text: p.structured_formatting?.main_text || p.description.split(',')[0] || p.description,
        secondary_text:
          p.structured_formatting?.secondary_text ||
          p.description.split(',').slice(1).join(',').trim() ||
          '',
        description: p.description,
        types: Array.isArray(p.types) ? p.types : [],
      }));

      return {
        success: true,
        suggestions,
      };
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      return {
        success: false,
        suggestions: [],
        error: isAbort ? 'Google Places request timed out' : 'Failed to query Google Places',
        errorCode: 'PROVIDER_ERROR',
      };
    }
  }

  async getDetails(placeId: string, sessionToken?: string): Promise<PlacesDetailsResult> {
    if (!this.isAvailable() || !this.apiKey) {
      return {
        success: false,
        error: 'GOOGLE_PLACES_API_KEY is not configured',
        errorCode: 'NOT_CONFIGURED',
      };
    }

    const trimmedPlaceId = placeId?.trim() || '';
    if (!trimmedPlaceId) {
      return {
        success: false,
        error: 'Place ID is required',
        errorCode: 'INVALID_REQUEST',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      let url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        trimmedPlaceId
      )}&fields=place_id,name,formatted_address,address_components,geometry&key=${encodeURIComponent(this.apiKey)}`;

      if (sessionToken?.trim()) {
        url += `&sessiontoken=${encodeURIComponent(sessionToken.trim())}`;
      }

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          error: `Google Places HTTP error: ${res.status}`,
          errorCode: 'PROVIDER_ERROR',
        };
      }

      const data = await res.json();

      if (data.status === 'NOT_FOUND') {
        return {
          success: false,
          error: 'Place not found in Google Places',
          errorCode: 'NOT_FOUND',
        };
      }

      if (data.status !== 'OK' || !data.result) {
        return {
          success: false,
          error: `Google Places API status: ${data.status}`,
          errorCode: 'PROVIDER_ERROR',
        };
      }

      const normalized = normalizeGooglePlaceDetails(data.result, trimmedPlaceId);
      if (!normalized) {
        return {
          success: false,
          error: 'Failed to normalize Google Place details',
          errorCode: 'PROVIDER_ERROR',
        };
      }

      return {
        success: true,
        details: normalized,
      };
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      return {
        success: false,
        error: isAbort ? 'Google Places details request timed out' : 'Failed to fetch Google Place details',
        errorCode: 'PROVIDER_ERROR',
      };
    }
  }
}
