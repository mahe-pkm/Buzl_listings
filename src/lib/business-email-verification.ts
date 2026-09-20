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

export function buildBusinessEmailVerificationUrl(token: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredOrigin) throw new Error("NEXT_PUBLIC_SITE_URL is required for business email verification.");
  const url = new URL("/verify-business-email", configuredOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}
