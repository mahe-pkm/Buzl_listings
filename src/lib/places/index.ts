import { PlacesProvider } from './types';
import { GooglePlacesProvider } from './google-provider';
import { MockPlacesProvider } from './mock-provider';
import { isProductionEnvironment, isStagingEnvironment } from '../staging';

export * from './types';
export * from './normalize';
export * from './google-provider';
export * from './mock-provider';

/**
 * Returns the configured PlacesProvider instance.
 *
 * Rules:
 * 1. Mock provider is strictly FORBIDDEN in production environment.
 * 2. If GOOGLE_PLACES_API_KEY is configured and GOOGLE_PLACES_MOCK !== 'true', use GooglePlacesProvider.
 * 3. In staging: If GOOGLE_PLACES_API_KEY is not configured and GOOGLE_PLACES_MOCK !== 'true',
 *    return GooglePlacesProvider (which will safely return NOT_CONFIGURED without mock fallback).
 * 4. In development/local/test (or when GOOGLE_PLACES_MOCK === 'true' outside production), use MockPlacesProvider.
 */
export function getPlacesProvider(): PlacesProvider {
  const isProd = isProductionEnvironment();
  const isStaging = isStagingEnvironment();
  const mockRequested = process.env.GOOGLE_PLACES_MOCK === 'true';
  const hasApiKey = Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());

  if (isProd && mockRequested) {
    throw new Error('GOOGLE_PLACES_MOCK is strictly forbidden in production environment');
  }

  if (hasApiKey && !mockRequested) {
    return new GooglePlacesProvider();
  }

  if (isProd) {
    return new GooglePlacesProvider();
  }

  if (isStaging && !mockRequested) {
    return new GooglePlacesProvider();
  }

  // Development, testing, or mock explicitly enabled (non-production)
  return new MockPlacesProvider();
}
