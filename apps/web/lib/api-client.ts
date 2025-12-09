import { Listing, ListingSearchParams } from '@project-x/shared-types';

export type PaginatedListingsResponse = {
  results: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:3001';

/**
 * Fetches a paginated list of listings from the backend API.
 * This function is intended to be called from server components.
 */
export async function fetchListings(
  params: ListingSearchParams = {},
): Promise<PaginatedListingsResponse> {
  const searchParams = new URLSearchParams();

  if (params.bbox) searchParams.set('bbox', params.bbox);
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.minPrice != null) searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) searchParams.set('maxPrice', String(params.maxPrice));
  if (params.beds != null) searchParams.set('beds', String(params.beds));
  if (params.baths != null) searchParams.set('baths', String(params.baths));
  if (params.propertyType) searchParams.set('propertyType', params.propertyType);
  if (params.sort) searchParams.set('sort', params.sort);

  const url = `${API_BASE_URL}/api/listings${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  const res = await fetch(url, {
    // Always fetch fresh data for search
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch listings: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as PaginatedListingsResponse;
}

/**
 * Fetches a single listing by its ID from the backend API.
 * Intended to be called from server components.
 */
export async function fetchListing(id: string): Promise<{ listing: Listing }> {
  const url = `${API_BASE_URL}/api/listings/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing ${id}: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as { listing: Listing };
}
