import { ApiError } from '@project-x/shared-types';

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

const nowSeconds = () => Date.now() / 1000;

export const rateLimit = (key: string, capacity: number): { allowed: true } | { allowed: false; retryAfterSeconds: number; error: ApiError } => {
  const cap = Math.max(1, capacity || 1);
  const refillPerSec = cap / 60;
  const bucket = buckets.get(key) ?? { tokens: cap, lastRefill: nowSeconds() };

  const current = nowSeconds();
  const elapsed = current - bucket.lastRefill;
  bucket.tokens = Math.min(cap, bucket.tokens + elapsed * refillPerSec);
  bucket.lastRefill = current;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { allowed: true };
  }

  const missing = 1 - bucket.tokens;
  const retryAfter = Math.ceil(missing / refillPerSec);
  buckets.set(key, bucket);
  const error: ApiError = {
    error: true,
    message: 'Rate limit exceeded for AI endpoint',
    code: 'RATE_LIMITED',
    status: 429,
  };
  return { allowed: false, retryAfterSeconds: retryAfter, error };
};
