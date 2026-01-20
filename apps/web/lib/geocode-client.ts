export type GeocodeSuccess = {
  ok: true;
  result: {
    bbox: string;
    center: { lat: number; lng: number };
    displayName: string;
    type?: string;
  };
};

export type GeocodeFailure = { ok: false; code: string; error: string };

export type GeocodeResponse = GeocodeSuccess | GeocodeFailure;

export async function geocode(query: string): Promise<GeocodeResponse> {
  try {
    const res = await fetch('/api/geo/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const body = await res.json().catch(() => null);
        if (body && typeof body.code === 'string' && typeof body.error === 'string') {
          return { ok: false, code: body.code, error: body.error };
        }
      }
      return { ok: false, code: 'HTTP_ERROR', error: 'Geocode failed' };
    }

    if (contentType.includes('application/json')) {
      const body = await res.json().catch(() => null);
      if (body && typeof body.ok === 'boolean') {
        return body as GeocodeResponse;
      }
    }
    return { ok: false, code: 'INVALID_RESPONSE', error: 'Geocode failed' };
  } catch {
    return { ok: false, code: 'FETCH_ERROR', error: 'Geocode failed' };
  }
}
