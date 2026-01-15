import { z } from "zod";

const statusEnum = z.enum(["for_sale", "pending", "sold"]);
const propertyTypeEnum = z.enum(["house", "condo", "townhome", "land", "multi_family"]);

export const proposedFiltersSchema = z
  .object({
    status: statusEnum.nullable(),
    propertyType: propertyTypeEnum.nullable(),
    minPrice: z.number().nullable(),
    maxPrice: z.number().nullable(),
    bedsMin: z.number().nullable(),
    bathsMin: z.number().nullable(),
    city: z.string().trim().nullable(),
    zip: z.string().trim().regex(/^\d{5}$/).nullable(),
    keywords: z.array(z.string().trim()).nullable(),
  })
  .strict();

export const parseSearchRequestSchema = z
  .object({
    prompt: z.string().min(1),
    context: z
      .object({
        currentFilters: z.record(z.string(), z.unknown()).optional(),
        searchText: z.string().nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const aiResponseBodySchema = z
  .object({
    proposedFilters: proposedFiltersSchema,
    explanations: z
      .array(
        z
          .object({
            field: z.string().trim(),
            reason: z.string().trim(),
          })
          .strict()
      )
      .default([]),
    confidence: z.number().min(0).max(1),
    warnings: z.array(z.string().trim()).default([]),
    ignoredInputReasons: z.array(z.string().trim()).default([]),
  })
  .strict();

export const aiResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    proposedFilters: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: ["string", "null"], enum: ["for_sale", "pending", "sold", null] },
        propertyType: {
          type: ["string", "null"],
          enum: ["house", "condo", "townhome", "land", "multi_family", null],
        },
        minPrice: { type: ["number", "null"] },
        maxPrice: { type: ["number", "null"] },
        bedsMin: { type: ["number", "null"] },
        bathsMin: { type: ["number", "null"] },
        city: { type: ["string", "null"] },
        zip: { type: ["string", "null"], pattern: "^\\d{5}$" },
        keywords: {
          type: ["array", "null"],
          items: { type: "string" },
          minItems: 0,
        },
      },
      required: [
        "status",
        "propertyType",
        "minPrice",
        "maxPrice",
        "bedsMin",
        "bathsMin",
        "city",
        "zip",
        "keywords",
      ],
    },
    explanations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          reason: { type: "string" },
        },
        required: ["field", "reason"],
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    warnings: { type: "array", items: { type: "string" } },
    ignoredInputReasons: { type: "array", items: { type: "string" } },
  },
  required: ["proposedFilters", "explanations", "confidence", "warnings", "ignoredInputReasons"],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const sanitizeModelOutput = (
  raw: any,
  ignoredInputReasons: string[] = []
): z.infer<typeof aiResponseBodySchema> => {
  const pf = raw?.proposedFilters ?? {};
  const minPrice = typeof pf?.minPrice === "number" ? pf.minPrice : null;
  const maxPrice = typeof pf?.maxPrice === "number" ? pf.maxPrice : null;
  let normalizedMinPrice = minPrice;
  let normalizedMaxPrice = maxPrice;
  if (normalizedMinPrice !== null && normalizedMaxPrice !== null && normalizedMinPrice > normalizedMaxPrice) {
    normalizedMinPrice = maxPrice;
    normalizedMaxPrice = minPrice;
  }

  const zip = typeof pf?.zip === "string" && /^\d{5}$/.test(pf.zip.trim()) ? pf.zip.trim() : null;

  const confidence =
    typeof raw?.confidence === "number" && Number.isFinite(raw.confidence)
      ? clamp(raw.confidence, 0, 1)
      : 0;

  const ignoredModel = Array.isArray(raw?.ignoredInputReasons)
    ? raw.ignoredInputReasons.filter((w: any) => typeof w === "string")
    : [];

  return {
    proposedFilters: {
      status: typeof pf?.status === "string" ? pf.status : null,
      propertyType: typeof pf?.propertyType === "string" ? pf.propertyType : null,
      minPrice: normalizedMinPrice,
      maxPrice: normalizedMaxPrice,
      bedsMin: typeof pf?.bedsMin === "number" ? pf.bedsMin : null,
      bathsMin: typeof pf?.bathsMin === "number" ? pf.bathsMin : null,
      city: typeof pf?.city === "string" ? pf.city.trim() : null,
      zip,
      keywords: Array.isArray(pf?.keywords)
        ? pf.keywords.filter((k: any) => typeof k === "string" && k.trim().length > 0).map((k: string) => k.trim())
        : null,
    },
    explanations: Array.isArray(raw?.explanations)
      ? raw.explanations.filter((e: any) => e && typeof e.field === "string" && typeof e.reason === "string")
      : [],
    confidence,
    warnings: Array.isArray(raw?.warnings)
      ? raw.warnings.filter((w: any) => typeof w === "string")
      : [],
    ignoredInputReasons: [...ignoredModel, ...ignoredInputReasons],
  };
};
