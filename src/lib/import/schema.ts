import { z } from 'zod';

export const BuzlProfileImportSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Business name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  additionalCategories: z.array(z.string()).optional().default([]),
  serviceModel: z
    .string()
    .transform((val) => val.toLowerCase().replace(/[\s-]+/g, '_'))
    .pipe(z.enum(['storefront', 'service_area', 'hybrid']))
    .catch('service_area'),
  country: z.string().optional().default('IN'),
  placeId: z.string().nullable().optional(),
  languages: z.array(z.string()).optional().default([]),
  timezone: z.string().optional(),

  location: z
    .object({
      address: z.string().optional().default(''),
      geo: z
        .object({
          lat: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).nullable().optional(),
          lng: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).nullable().optional(),
        })
        .optional()
        .default({ lat: null, lng: null }),
      serviceAreas: z.array(z.string()).optional().default([]),
      landmarks: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ address: '', geo: { lat: null, lng: null }, serviceAreas: [], landmarks: [] }),

  contact: z
    .object({
      phone: z.string().optional().default(''),
      email: z.string().optional().default(''),
      bookingUrl: z.string().optional().default(''),
    })
    .optional()
    .default({ phone: '', email: '', bookingUrl: '' }),

  services: z
    .array(
      z.union([
        z.string(),
        z.object({ name: z.string() }).transform((s) => s.name),
      ])
    )
    .optional()
    .default([]),

  products: z.array(z.unknown()).optional().default([]),
  usp: z.array(z.string()).optional().default([]),
  tagline: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  performanceKeywords: z.array(z.string()).optional().default([]),

  website: z
    .object({
      url: z.string().optional().default(''),
      scope: z.string().optional(),
    })
    .optional()
    .default({ url: '' }),

  social: z
    .record(z.string(), z.string())
    .optional()
    .default({}),

  competitors: z.array(z.unknown()).optional().default([]),
  locId: z.string().nullable().optional(),
  bussId: z.string().nullable().optional(),
  status: z.string().optional().default('active'),
  gbpStatus: z.string().optional().default('active'),

  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type BuzlProfileImportInput = z.infer<typeof BuzlProfileImportSchema>;

export interface ValidationResult {
  success: boolean;
  data?: BuzlProfileImportInput;
  errors?: string[];
}

export function validateBuzlProfileJson(jsonString: string): ValidationResult {
  try {
    const raw = JSON.parse(jsonString);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        success: false,
        errors: ['Import payload must be a JSON object representing a Buzl profile.'],
      };
    }

    const result = BuzlProfileImportSchema.safeParse(raw);
    if (!result.success) {
      const formattedErrors = result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
      );
      return {
        success: false,
        errors: formattedErrors,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      errors: [`Malformed JSON: ${(err as Error).message}`],
    };
  }
}
