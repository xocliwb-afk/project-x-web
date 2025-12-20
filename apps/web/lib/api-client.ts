import {
  Listing,
  ListingSearchParams,
  ListingSearchResponse,
  PlanTourRequest,
  PlannedTour,
} from '@project-x/shared-types';

export type FetchListingsParams = ListingSearchParams & {
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
};

export type PaginatedListingsResponse = ListingSearchResponse;

import { getApiBaseUrl } from "./getApiBaseUrl";

const API_BASE_URL = getApiBaseUrl();
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Fetches a paginated list of listings from the backend API.
 * Safe for both server and client components (uses GET with query params).
 */
export async function fetchListings(
  params: FetchListingsParams = {},
  signal?: AbortSignal,
): Promise<PaginatedListingsResponse> {
  const searchParams = new URLSearchParams();

  const bboxFromCorners =
    params.swLat != null &&
    params.swLng != null &&
    params.neLat != null &&
    params.neLng != null
      ? `${params.swLng},${params.swLat},${params.neLng},${params.neLat}`
      : null;

  const bbox = params.bbox ?? bboxFromCorners;

  if (bbox) searchParams.set('bbox', bbox);
  if (params.q) searchParams.set('q', params.q);
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.minPrice != null) searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) searchParams.set('maxPrice', String(params.maxPrice));
  if (params.beds != null) searchParams.set('beds', String(params.beds));
  if (params.baths != null) searchParams.set('baths', String(params.baths));
  if (params.propertyType) searchParams.set('propertyType', params.propertyType);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.status?.length)
    searchParams.set('status', params.status.filter(Boolean).join(','));
  if (params.minSqft != null) searchParams.set('minSqft', String(params.minSqft));
  if (params.maxSqft != null) searchParams.set('maxSqft', String(params.maxSqft));
  if (params.minYearBuilt != null)
    searchParams.set('minYearBuilt', String(params.minYearBuilt));
  if (params.maxYearBuilt != null)
    searchParams.set('maxYearBuilt', String(params.maxYearBuilt));
  if (params.maxDaysOnMarket != null)
    searchParams.set('maxDaysOnMarket', String(params.maxDaysOnMarket));
  if (params.keywords) searchParams.set('keywords', params.keywords);

  const qs = searchParams.toString();
  const url = `${API_BASE_URL}/api/listings${qs ? `?${qs}` : ''}`;

  if (isDev) {
    console.log(`[api-client] GET ${url}`);
  }

  let loggedError = false;

  try {
    const res = await fetch(url, {
      // Always fetch fresh data for search
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      let bodySnippet = '';
      try {
        const rawBody = await res.text();
        bodySnippet = rawBody.slice(0, 200);
      } catch {
        bodySnippet = '<unable to read body>';
      }

      if (isDev) {
        console.error(
          `[api-client] listings request failed ${res.status} ${res.statusText} for ${url}. Body: ${bodySnippet}`,
        );
        loggedError = true;
      }
      throw new Error(`Failed to fetch listings: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as PaginatedListingsResponse;
  } catch (err: any) {
    if (isDev && !loggedError) {
      console.error(
        `[api-client] listings request error for ${url}:`,
        err?.message ?? err,
      );
    }
    throw err;
  }
}

/**
 * Fetches a single listing by its ID from the backend API.
 * Intended to be called from server components.
 */
export async function fetchListing(id: string): Promise<{ listing: Listing }> {
  const url = `${API_BASE_URL}/api/listing/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing ${id}: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as { listing: Listing };
}

export async function planTourApi(payload: PlanTourRequest): Promise<PlannedTour> {
  const url = `${API_BASE_URL}/api/tours`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = 'Failed to plan tour';
    try {
      const data = await res.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as PlannedTour;
}
