import { Router } from 'express';
import crypto from 'crypto';
import { ApiError } from '@project-x/shared-types';
import {
  aiRequestSchema,
  aiResponseBodySchema,
  aiResponseJsonSchema,
  sanitizeModelOutput,
} from '../services/aiParseSearch.schema';
import { callGemini } from '../services/gemini.service';
import { rateLimit } from '../services/rateLimiter.service';

const router = Router();

const AI_MAX_PROMPT_CHARS = Number(process.env.AI_MAX_PROMPT_CHARS) || 4000;
const AI_RATE_LIMIT_RPM = Number(process.env.AI_RATE_LIMIT_RPM) || 60;

const sendError = (res: any, error: ApiError) => {
  res.status(error.status).json(error);
};

router.post('/parse-search', async (req, res) => {
  const requestId = crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  const started = Date.now();

  try {
    if (process.env.AI_ENABLED !== 'true') {
      const err: ApiError = {
        error: true,
        message: 'AI features are disabled',
        code: 'AI_DISABLED',
        status: 503,
      };
      return sendError(res, err);
    }

    const rateKey = `ai:parse-search:${req.ip || 'unknown'}`;
    const rateResult = rateLimit(rateKey, AI_RATE_LIMIT_RPM);
    if (!rateResult.allowed) {
      res.setHeader('Retry-After', String(rateResult.retryAfterSeconds));
      return sendError(res, rateResult.error);
    }

    const bodySchema = aiRequestSchema(AI_MAX_PROMPT_CHARS);
    const parsedBody = bodySchema.parse(req.body);
    const reasons: string[] = [];

    const trimmedPrompt = parsedBody.prompt.trim();
    if (trimmedPrompt.length === 0) {
      const err: ApiError = {
        error: true,
        message: 'prompt is required',
        code: 'BAD_REQUEST',
        status: 400,
      };
      return sendError(res, err);
    }

    let contextString = '';
    if (parsedBody.context) {
      const serialized = JSON.stringify(parsedBody.context);
      if (serialized.length > 4000) {
        reasons.push('context_too_large_ignored');
      } else {
        contextString = serialized;
      }
    }

    const prompt = [
      'You are an assistant that converts a real estate search prompt into structured filters.',
      'Respond ONLY with JSON matching the provided schema. Do not add extra fields.',
      `User prompt: ${trimmedPrompt}`,
      contextString ? `Context: ${contextString}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const geminiResult = await callGemini({ prompt, schema: aiResponseJsonSchema, requestId });

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(geminiResult.text);
    } catch (err) {
      const error: ApiError = {
        error: true,
        message: 'Gemini returned invalid JSON',
        code: 'AI_BAD_MODEL_OUTPUT',
        status: 502,
      };
      return sendError(res, error);
    }

    const sanitized = sanitizeModelOutput(parsedOutput);
    const validated = aiResponseBodySchema.parse(sanitized);
    const finalWarnings = validated.ignoredInputReasons || [];
    if (reasons.length) {
      validated.ignoredInputReasons = [...finalWarnings, ...reasons];
    }

    const latencyMs = Date.now() - started;
    console.info(
      JSON.stringify({
        requestId,
        promptLength: trimmedPrompt.length,
        outcome: 'ok',
        latencyMs,
        modelStatus: geminiResult.status,
      })
    );

    return res.status(200).json({ requestId, ...validated });
  } catch (err: any) {
    const latencyMs = Date.now() - started;
    console.error(
      JSON.stringify({
        requestId,
        promptLength: typeof req.body?.prompt === 'string' ? req.body.prompt.length : 0,
        outcome: 'error',
        latencyMs,
        error: err?.code || err?.message || 'unknown',
      })
    );

    if (err?.name === 'ZodError') {
      const error: ApiError = {
        error: true,
        message: 'Invalid request body',
        code: 'BAD_REQUEST',
        status: 400,
      };
      return sendError(res, error);
    }

    if ((err as ApiError)?.error && typeof (err as ApiError).status === 'number') {
      return sendError(res, err as ApiError);
    }

    const error: ApiError = {
      error: true,
      message: err?.message || 'AI request failed',
      code: err?.code || 'AI_UPSTREAM_ERROR',
      status: err?.status || 502,
    };
    return sendError(res, error);
  }
});

export default router;
