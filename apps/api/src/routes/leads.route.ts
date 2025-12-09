import { Router, Request, Response } from 'express';
import { LeadPayload, ApiError, LeadResponse } from '@project-x/shared-types';
import { LeadService } from '../services/lead.service';

const router = Router();
const leadService = new LeadService();

const requiredFields: Array<keyof LeadPayload> = [
  'listingId',
  'name',
  'email',
  'brokerId',
  'source',
];

const createLeadHandler = async (req: Request, res: Response) => {
  const payload = req.body as LeadPayload;
  const normalizedPayload: LeadPayload = {
    ...payload,
    source: payload.source ?? 'project-x-web',
  };

  try {
    const missing = requiredFields.filter((field) => !normalizedPayload?.[field]);
    if (missing.length > 0) {
      const error: ApiError = {
        error: true,
        message: `Missing required fields: ${missing.join(', ')}`,
        code: 'VALIDATION_ERROR',
        status: 400,
      };
      return res.status(400).json(error);
    }

    await leadService.submitLead(normalizedPayload);

    const response: LeadResponse = { success: true };
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
