import { z } from "zod";

export const businessSchema = z
  .object({
    canonicalName: z.string().trim().min(1).max(160),
    primaryPhone: z.string().trim().min(7).max(32),
    primaryCategoryId: z.string().uuid(),
    locationMode: z.enum(["storefront", "service_area", "hybrid"]),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    country: z.string().trim().min(1).max(100),
    addressLine1: z.string().trim().max(160).optional(),
    postalCode: z.string().trim().max(20).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    serviceAreas: z.array(z.string().trim().min(1).max(120)).default([]),
    businessContactEmail: z.string().email().optional().or(z.literal("")),
    websiteUrl: z.string().url().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const needsStorefront = value.locationMode !== "service_area";
    if (needsStorefront && !value.addressLine1) ctx.addIssue({ code: "custom", path: ["addressLine1"], message: "A public storefront address is required." });
    if (needsStorefront && (value.latitude === undefined || value.longitude === undefined)) ctx.addIssue({ code: "custom", path: ["latitude"], message: "A public map location is required." });
    if (value.locationMode !== "storefront" && value.serviceAreas.length === 0) ctx.addIssue({ code: "custom", path: ["serviceAreas"], message: "At least one named service area is required." });
  });
