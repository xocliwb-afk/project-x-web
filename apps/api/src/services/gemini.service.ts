import fetch from 'node-fetch';
import { ApiError } from '@project-x/shared-types';

const DEFAULT_TIMEOUT = Number(process.env.AI_TIMEOUT_MS) || 10000;
const MAX_ATTEMPTS = Number(process.env.AI_RETRY_MAX_ATTEMPTS) || 2;

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export type GeminiResult = {
  text: string;
  status: number;
};

export async function callGemini({
  prompt,
  schema,
  requestId,
}: {
  prompt: string;
  schema: Record<string, any>;
  requestId: string;
}): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT;
  const maxAttempts = Math.max(1, Number(process.env.AI_RETRY_MAX_ATTEMPTS) || MAX_ATTEMPTS);

  if (!apiKey) {
    const error: ApiError = {
      error: true,
      message: 'Gemini API key not configured',
      code: 'AI_CONFIG_ERROR',
      status: 500,
    };
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastError = new Error(`Gemini HTTP ${res.status}`);
        if (isRetryableStatus(res.status) && attempt < maxAttempts) {
          const backoff = 150 * attempt + Math.floor(Math.random() * 250);
          await sleep(backoff);
          continue;
        }
        const error: ApiError = {
          error: true,
          message: `Gemini request failed (${res.status})`,
          code: res.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UPSTREAM_ERROR',
          status: res.status === 429 ? 429 : 502,
        };
        throw error;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== 'string') {
        const error: ApiError = {
          error: true,
          message: 'Gemini response missing content',
          code: 'AI_BAD_MODEL_OUTPUT',
          status: 502,
        };
        throw error;
      }

      return { text, status: res.status };
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err?.name === 'AbortError';
      const retryable = isAbort || err?.code === 'ECONNRESET' || err?.code === 'ENOTFOUND';
      if (retryable && attempt < maxAttempts) {
        const backoff = 150 * attempt + Math.floor(Math.random() * 250);
        await sleep(backoff);
        continue;
      }
      lastError = err;
      break;
    }
  }

  if (lastError && (lastError as ApiError).error) {
    throw lastError;
  }

  const error: ApiError = {
    error: true,
    message: lastError?.message || 'Gemini request failed',
    code: lastError?.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_UPSTREAM_ERROR',
    status: lastError?.status || 502,
  };
  throw error;
}
