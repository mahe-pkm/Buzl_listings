/**
 * Staging Environment & URL Helper
 * Provides centralized detection of staging runtime to enforce
 * search engine safety (global noindex, robots disallow) without
 * altering canonical production SEO logic.
 */

export function isStagingEnvironment(): boolean {
  return (
    process.env.NEXT_PUBLIC_IS_STAGING === 'true' ||
    process.env.BUZL_ENV === 'staging' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  );
}
