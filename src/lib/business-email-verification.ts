import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const BUSINESS_EMAIL_VERIFICATION_EXPIRY_MINUTES = 30;

export function normalizeBusinessContactEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

export function createBusinessEmailVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashBusinessEmailVerificationToken(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

export function toPostgresBytea(value: Buffer): string {
  return `\\x${value.toString("hex")}`;
}

export function getBusinessEmailBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  );
}

export function buildBusinessEmailVerificationUrl(token: string): string {
  const base = getBusinessEmailBaseUrl().replace(/\/+$/, '');
  const url = new URL('/verify-business-email', base);
  url.searchParams.set('token', token);
  return url.toString();
}
