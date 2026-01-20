export type GeocodeResult =
  | {
      ok: true;
      result: {
        bbox: string;
        center: { lat: number; lng: number };
        displayName: string;
        type: 'city' | 'zip' | 'address' | 'region' | 'unknown';
      };
    }
  | { ok: false; code: string; error: string };

export async function geocode(query: string): Promise<GeocodeResult> {
  const res = await fetch('/api/geo/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const json = await res.json().catch(() => ({ ok: false, code: 'BAD_RESPONSE', error: 'Invalid response' }));
  return json as GeocodeResult;
}
