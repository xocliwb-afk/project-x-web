import { Router, Request, Response } from "express";
import { LeadService } from "../services/lead.service";
import type { LeadRequest } from "../types/lead";

const router = Router();
const leadService = new LeadService();

const createLeadHandler = async (req: Request, res: Response) => {
  const payload = req.body as LeadRequest;

  try {
    const result = await leadService.submitLead(payload);

    if (result.success) {
      return res.status(201).json({ success: true });
    }

    const status = result.status ?? 400;
    return res.status(status).json({
      success: false,
      message: result.message ?? "Failed to submit lead",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message ?? "Failed to submit lead",
    });
  }
};

router.post("/v1/leads", createLeadHandler);
router.post("/leads", createLeadHandler);

export default router;
