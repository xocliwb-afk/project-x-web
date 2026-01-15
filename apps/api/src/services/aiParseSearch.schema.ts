import { z } from 'zod';

const statusEnum = z.enum(['for_sale', 'pending', 'sold']).nullable();
const propertyTypeEnum = z.enum(['house', 'condo', 'townhome', 'land', 'multi_family']).nullable();

export const proposedFiltersSchema = z
  .object({
    status: statusEnum,
    propertyType: propertyTypeEnum,
    minPrice: z.number().int().nonnegative().nullable(),
    maxPrice: z.number().int().nonnegative().nullable(),
    bedsMin: z.number().int().nonnegative().nullable(),
    bathsMin: z.number().int().nonnegative().nullable(),
    city: z.string().trim().min(1).nullable(),
    zip: z.string().trim().min(5).max(5).nullable(),
    keywords: z.array(z.string().trim().min(1)).min(1).nullable(),
  })
  .strict();

export const aiResponseBodySchema = z
  .object({
    proposedFilters: proposedFiltersSchema,
    explanations: z
      .array(
        z
          .object({
            field: z.string().trim().min(1),
            reason: z.string().trim().min(1),
          })
          .strict()
      )
      .default([]),
    confidence: z.number().min(0).max(1),
    warnings: z.array(z.string()).default([]),
    ignoredInputReasons: z.array(z.string()).default([]),
  })
  .strict();

export const aiRequestSchema = (maxPromptChars: number) =>
  z
    .object({
      prompt: z.string().trim().min(1).max(maxPromptChars),
      context: z
        .object({
          currentFilters: z.record(z.string(), z.any()).optional(),
          searchText: z.string().nullable().optional(),
        })
        .strict()
        .optional(),
    })
    .strict();

export const aiResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    proposedFilters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        status: { type: ['string', 'null'], enum: ['for_sale', 'pending', 'sold', null] },
        propertyType: {
          type: ['string', 'null'],
          enum: ['house', 'condo', 'townhome', 'land', 'multi_family', null],
        },
        minPrice: { type: ['number', 'null'] },
        maxPrice: { type: ['number', 'null'] },
        bedsMin: { type: ['number', 'null'] },
        bathsMin: { type: ['number', 'null'] },
        city: { type: ['string', 'null'] },
        zip: { type: ['string', 'null'], pattern: '^\\d{5}$' },
        keywords: { type: ['array', 'null'], items: { type: 'string' } },
      },
      required: ['status', 'propertyType', 'minPrice', 'maxPrice', 'bedsMin', 'bathsMin', 'city', 'zip', 'keywords'],
    },
    explanations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['field', 'reason'],
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    warnings: { type: 'array', items: { type: 'string' } },
    ignoredInputReasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['proposedFilters', 'explanations', 'confidence', 'warnings', 'ignoredInputReasons'],
};

export const sanitizeModelOutput = (raw: any) => {
  const output: any = { ...raw };

  output.proposedFilters = output.proposedFilters ?? {};
  const pf: any = output.proposedFilters;

  const numOrNull = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  pf.minPrice = numOrNull(pf.minPrice);
  pf.maxPrice = numOrNull(pf.maxPrice);
  if (pf.minPrice !== null && pf.maxPrice !== null && pf.minPrice > pf.maxPrice) {
    const tmp = pf.minPrice;
    pf.minPrice = pf.maxPrice;
    pf.maxPrice = tmp;
  }
  pf.bedsMin = numOrNull(pf.bedsMin);
  pf.bathsMin = numOrNull(pf.bathsMin);

  const cleanString = (v: any) => (typeof v === 'string' && v.trim().length ? v.trim() : null);
  pf.city = cleanString(pf.city);
  pf.propertyType =
    pf.propertyType && ['house', 'condo', 'townhome', 'land', 'multi_family'].includes(pf.propertyType)
      ? pf.propertyType
      : null;
  pf.status = pf.status && ['for_sale', 'pending', 'sold'].includes(pf.status) ? pf.status : null;

  const zip = cleanString(pf.zip);
  pf.zip = zip && /^\d{5}$/.test(zip) ? zip : null;

  if (Array.isArray(pf.keywords)) {
    const kw = pf.keywords.map((k: any) => cleanString(k)).filter(Boolean);
    pf.keywords = kw.length ? kw : null;
  } else {
    pf.keywords = null;
  }

  output.explanations = Array.isArray(output.explanations) ? output.explanations : [];
  output.warnings = Array.isArray(output.warnings) ? output.warnings : [];
  output.ignoredInputReasons = Array.isArray(output.ignoredInputReasons)
    ? output.ignoredInputReasons
    : [];

  const conf = Number(output.confidence);
  output.confidence = Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0;

  return output;
};
