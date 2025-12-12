export type ParsedBbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

/**
  * Parses a bbox string in the format "minLng,minLat,maxLng,maxLat".
  * Returns a parsed object if valid, otherwise null.
  */
export function parseBbox(bbox?: string): ParsedBbox | null {
  if (!bbox) return null;

  const parts = bbox.split(',');
  if (parts.length !== 4) return null;

  const numbers = parts.map((value) => Number(value));
  if (numbers.some((value) => !Number.isFinite(value))) return null;

  const [minLng, minLat, maxLng, maxLat] = numbers;

  // Basic bounds guard to catch swapped inputs and invalid ranges.
  if (
    minLng < -180 ||
    minLng > 180 ||
    maxLng < -180 ||
    maxLng > 180 ||
    minLat < -90 ||
    minLat > 90 ||
    maxLat < -90 ||
    maxLat > 90
  ) {
    return null;
  }

  if (minLng >= maxLng || minLat >= maxLat) return null;

  return { minLng, minLat, maxLng, maxLat };
}

export function formatBbox({ minLng, minLat, maxLng, maxLat }: ParsedBbox): string {
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}
