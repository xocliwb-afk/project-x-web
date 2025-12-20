import { NormalizedListing } from '@project-x/shared-types';

type MapOptions = {
  requireCoordinates?: boolean;
};

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const PROPERTY_TYPE_MAP: Record<string, string> = {
  RES: 'Single Family',
  RNT: 'Rental',
  CND: 'Condo',
  CONDO: 'Condo',
  CONDOMINIUM: 'Condo',
  'SINGLE FAMILY': 'Single Family',
  'SINGLE-FAMILY': 'Single Family',
  'MULTI-FAMILY': 'Multi-Family',
  MULTIFAMILY: 'Multi-Family',
  MULTI: 'Multi-Family',
  LAND: 'Land',
  LOT: 'Land',
  LND: 'Land',
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'FOR_SALE',
  'ACTIVE UNDER CONTRACT': 'PENDING',
  PENDING: 'PENDING',
  CONTINGENT: 'PENDING',
  CLOSED: 'SOLD',
  SOLD: 'SOLD',
  LEASED: 'SOLD',
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function mapStatus(rawStatus: unknown): string {
  if (typeof rawStatus !== 'string') return 'UNKNOWN';
  const normalized = rawStatus.trim().toUpperCase();
  const mapped = STATUS_MAP[normalized];
  if (mapped) return mapped;
  return normalized || 'UNKNOWN';
}

function mapPropertyType(raw: any): string | null {
  const typeCandidates: Array<string | undefined | null> = [
    raw?.property?.type,
    raw?.property?.subType,
    raw?.property?.subTypeText,
    raw?.property?.style,
  ];

  for (const candidate of typeCandidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const key = candidate.trim().toUpperCase();
    if (PROPERTY_TYPE_MAP[key]) {
      return PROPERTY_TYPE_MAP[key];
    }
    // Sometimes subtype comes as "Condominium" or "SingleFamilyResidence".
    if (key.includes('CONDO')) return 'Condo';
    if (key.includes('TOWN')) return 'Townhouse';
    if (key.includes('MULTI')) return 'Multi-Family';
    if (key.includes('LAND') || key.includes('LOT')) return 'Land';
    if (key.includes('SINGLE')) return 'Single Family';
  }

  const fallback = typeCandidates.find((c) => typeof c === 'string');
  return (fallback as string | undefined) ?? null;
}

function normalizeBaths(full?: number | null, half?: number | null): number | null {
  const fullVal = typeof full === 'number' ? full : null;
  const halfVal = typeof half === 'number' ? half : null;
  if (fullVal === null && halfVal === null) return null;
  const total = (fullVal ?? 0) + (halfVal ?? 0) * 0.5;
  return Number.isFinite(total) ? total : null;
}

function normalizeLotSize(raw: any): number | null {
  const candidates: Array<number | null> = [
    toNumber(raw?.property?.lotSizeArea),
    toNumber(raw?.property?.acres),
    toNumber(raw?.property?.lotSize),
  ];

  for (const value of candidates) {
    if (value !== null) return value;
  }

  return null;
}

function normalizeAddress(raw: any) {
  const full =
    typeof raw?.address?.full === 'string' && raw.address.full.trim().length > 0
      ? raw.address.full
      : null;

  const streetName = raw?.address?.streetName ?? '';
  const streetNumber = raw?.address?.streetNumberText ?? raw?.address?.streetNumber ?? '';
  const street = [streetNumber, streetName].join(' ').trim();

  const city = raw?.address?.city ?? '';
  const state = raw?.address?.state ?? '';
  const zip = raw?.address?.postalCode ?? '';

  return {
    full: full || [street, city, state, zip].filter(Boolean).join(', ') || 'Address not available',
    street: street || full || 'Address not available',
    city,
    state,
    zip,
  };
}

export function mapSimplyRetsListing(
  raw: any,
  options: MapOptions = {},
): NormalizedListing | null {
  if (!raw) return null;

  const id = raw.mlsId ?? raw.listingId ?? raw.id;
  if (!id) return null;

  const lat = toNumber(raw?.geo?.lat);
  const lng = toNumber(raw?.geo?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (options.requireCoordinates && !hasCoords) {
    return null;
  }

  const listPrice = toNumber(raw.listPrice) ?? 0;
  const photos = Array.isArray(raw.photos) ? raw.photos.filter(Boolean) : [];

  const address = normalizeAddress(raw);
  const description =
    typeof raw?.remarks === 'string' ? raw.remarks.trim() : null;
  const virtualTourRaw =
    typeof raw?.virtualTourUrl === 'string' ? raw.virtualTourUrl.trim() : null;
  const virtualTourUrl =
    virtualTourRaw && virtualTourRaw.length > 0 && /^https?:\/\//i.test(virtualTourRaw)
      ? virtualTourRaw
      : null;

  return {
    id: String(id),
    mlsId: String(raw.mlsId ?? id),
    listPrice,
    listPriceFormatted: priceFormatter.format(listPrice),
    description: description && description.length > 0 ? description : null,
    virtualTourUrl,
    address: {
      ...address,
      lat: hasCoords ? (lat as number) : null,
      lng: hasCoords ? (lng as number) : null,
    },
    media: {
      photos,
      thumbnailUrl: photos.length > 0 ? photos[0] : null,
    },
    attribution: {
      mlsName: raw.mls?.name ?? 'SimplyRETS',
      disclaimer:
        raw.disclaimer ??
        'Listing information is deemed reliable but not guaranteed.',
      logoUrl: null,
    },
    details: {
      beds: toNumber(raw?.property?.bedrooms),
      baths: normalizeBaths(raw?.property?.bathsFull, raw?.property?.bathsHalf),
      sqft: toNumber(raw?.property?.area),
      lotSize: normalizeLotSize(raw),
      yearBuilt: toNumber(raw?.property?.yearBuilt),
      hoaFees: toNumber(raw?.association?.fee),
      basement:
        Array.isArray(raw?.property?.basement) && raw.property.basement.length > 0
          ? raw.property.basement.join(', ')
          : (raw?.property?.basement as string | null) ?? null,
      propertyType: mapPropertyType(raw),
      status: mapStatus(raw?.mls?.status),
    },
    meta: {
      daysOnMarket: toNumber(raw?.mls?.daysOnMarket),
      mlsName: raw.mls?.name ?? raw.office?.name ?? null,
    },
  };
}
