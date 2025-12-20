import { setTimeout as delay } from 'timers/promises';

type QueryValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Array<string | number | boolean>;

type RequestOptions = {
  searchParams?: Record<string, QueryValue>;
  allow404?: boolean;
};

type RequestResult<T> = {
  data: T | null;
  status: number;
  headers: Headers;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

function buildAuthHeader(): string {
  const apiKey = process.env.SIMPLYRETS_API_KEY;
  const apiSecret = process.env.SIMPLYRETS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      'SIMPLYRETS_API_KEY and SIMPLYRETS_API_SECRET must be set when DATA_PROVIDER=simplyrets',
    );
  }

  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return `Basic ${token}`;
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function buildUrl(path: string, searchParams?: Record<string, QueryValue>): string {
  const baseUrl = process.env.SIMPLYRETS_BASE_URL || 'https://api.simplyrets.com';
  const url = new URL(path, baseUrl);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export class SimplyRetsClient {
  private readonly authHeader = buildAuthHeader();

  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  public async getProperties(
    searchParams?: Record<string, QueryValue>,
  ): Promise<RequestResult<any[]>> {
    return this.request<any[]>('/properties', { searchParams });
  }

  public async getPropertyById(id: string): Promise<RequestResult<any>> {
    return this.request<any>(`/properties/${encodeURIComponent(id)}`, { allow404: true });
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<RequestResult<T>> {
    const url = buildUrl(path, options.searchParams);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: this.authHeader,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (options.allow404 && res.status === 404) {
          return { data: null, status: res.status, headers: res.headers };
        }

        if (shouldRetry(res.status) && attempt < MAX_RETRIES) {
          await delay(250 * (attempt + 1));
          continue;
        }

        if (!res.ok) {
          throw new Error(`SimplyRETS request failed (${res.status})`);
        }

        const data = (await res.json()) as T;
        return { data, status: res.status, headers: res.headers };
      } catch (err: any) {
        clearTimeout(timeout);

        const isAbort = err?.name === 'AbortError';
        if ((isAbort || shouldRetry(err?.status ?? 0)) && attempt < MAX_RETRIES) {
          await delay(250 * (attempt + 1));
          continue;
        }

        throw err;
      }
    }

    throw new Error('SimplyRETS request failed after retries');
  }
}
