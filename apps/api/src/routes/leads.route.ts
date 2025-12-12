import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { ApiError, LeadCreateResponse } from '@project-x/shared-types';
import { LeadService } from '../services/lead.service';
import type { NormalizedLead } from '../providers/crm/crm-provider.interface';

const router = Router();
const leadService = new LeadService();

const SOURCE_VALUES = ['pdp', 'search', 'tour', 'contact', 'unknown'] as const;
const MAX_REQUESTS = 10;
const WINDOW_MS = 10 * 60 * 1000;
const rateLimitBuckets = new Map<string, number[]>();

const leadSchema = z.object({
  // Legacy fields
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  listingId: z.string().optional(),
  listingAddress: z.string().optional(),
  brokerId: z.string().optional(),
  agentId: z.string().optional(),
  source: z.string().optional(),
  // New fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  sourceUrl: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  consentToContact: z.boolean().optional(),
  preferredContact: z.enum(['phone', 'email', 'text']).optional(),
  honeypot: z.string().optional(),
});

const toApiError = (message: string, code: string, status: number): ApiError => ({
  error: true,
  message,
  code,
  status,
});

const trimString = (value?: string | null) =>
  typeof value === 'string' ? value.trim() || undefined : undefined;

const normalizeEmail = (value?: string) => {
  const trimmed = trimString(value);
  return trimmed ? trimmed.toLowerCase() : undefined;
};

const normalizePhone = (value?: string) => {
  const trimmed = trimString(value);
  if (!trimmed) return undefined;
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : undefined;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits || undefined;
};

const splitName = (fullName?: string) => {
  const trimmed = trimString(fullName);
  if (!trimmed) return { firstName: undefined, lastName: undefined };
  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length === 0) return { firstName: undefined, lastName: undefined };
  const [first, ...rest] = parts;
  return {
    firstName: first,
    lastName: rest.length ? rest.join(' ') : undefined,
  };
};

const normalizeSource = (value?: string) => {
  const candidate = trimString(value);
  if (!candidate) return 'unknown' as const;
  const lower = candidate.toLowerCase();
  return SOURCE_VALUES.includes(lower as any) ? (lower as (typeof SOURCE_VALUES)[number]) : 'unknown';
};

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const bucket = rateLimitBuckets.get(ip) ?? [];
  const recent = bucket.filter((ts) => ts > windowStart);
  recent.push(now);
  rateLimitBuckets.set(ip, recent);
  return recent.length <= MAX_REQUESTS;
};

const normalizeLead = (input: z.infer<typeof leadSchema>): { lead: NormalizedLead; honeypot?: string } => {
  const leadId = randomUUID();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const { firstName: splitFirst, lastName: splitLast } = splitName(input.name);

  const firstName = trimString(input.firstName) ?? splitFirst;
  const lastName = trimString(input.lastName) ?? splitLast;

  const normalized: NormalizedLead = {
    leadId,
    brokerId: trimString(input.brokerId) || 'default-broker',
    agentId: trimString(input.agentId),
    listingId: trimString(input.listingId),
    listingAddress: trimString(input.listingAddress),
    firstName,
    lastName,
    email,
    phone,
    message: trimString(input.message),
    source: normalizeSource(input.source),
    sourceUrl: trimString(input.sourceUrl),
    utmSource: trimString(input.utmSource),
    utmMedium: trimString(input.utmMedium),
    utmCampaign: trimString(input.utmCampaign),
    consentToContact: input.consentToContact === true,
    preferredContact: input.preferredContact,
  };

  return { lead: normalized, honeypot: trimString(input.honeypot) };
};

const getClientIp = (req: Request) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    return xff.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const createLeadHandler = async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json(toApiError('Too many requests', 'RATE_LIMITED', 429));
  }

  const parseResult = leadSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json(
      toApiError(
        'Invalid lead payload',
        'VALIDATION_ERROR',
        400,
      ),
    );
  }

  const { lead: normalized, honeypot } = normalizeLead(parseResult.data);

  if (!normalized.consentToContact) {
    return res
      .status(400)
      .json(toApiError('Consent to contact is required', 'CONSENT_REQUIRED', 400));
  }

  if (!normalized.email && !normalized.phone && !normalized.message) {
    return res.status(400).json(
      toApiError(
        'Provide at least an email, phone, or message',
        'CONTACT_REQUIRED',
        400,
      ),
    );
  }

  if (honeypot) {
    const response: LeadCreateResponse = {
      success: true,
      ok: true,
      leadId: `spam-${randomUUID()}`,
      receivedAt: new Date().toISOString(),
    };
    return res.status(200).json(response);
  }

  try {
    await leadService.submitLead(normalized);

    const response: LeadCreateResponse = {
      success: true,
      ok: true,
      leadId: normalized.leadId,
      receivedAt: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (err: any) {
    const status = err?.message?.includes('not configured') ? 503 : 500;
    const error: ApiError = {
      error: true,
      message: err?.message ?? 'Failed to submit lead',
      code: status === 503 ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
      status,
    };
    res.status(status).json(error);
  }
};

router.post('/v1/leads', createLeadHandler);
router.post('/leads', createLeadHandler);

export default router;
