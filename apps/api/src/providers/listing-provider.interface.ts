import {
  ListingPagination,
  ListingSearchParams,
  ListingSearchResponse,
  NormalizedListing,
} from '@project-x/shared-types';

/**
 * ListingProvider abstracts the underlying data source (mock, SimplyRETS, etc.)
 * and always returns normalized listings.
 */
export interface ListingProvider {
  /**
   * Searches for listings based on a set of criteria.
   * @param params - The search parameters (bbox, price range, beds, baths, etc.).
   * @returns A promise that resolves to normalized listings plus pagination metadata.
   */
  search(params: ListingSearchParams): Promise<ListingSearchResponse>;

  /**
   * Retrieves a single listing by its unique ID.
   * @param id - The unique identifier for the listing.
   * @returns A promise that resolves to a normalized listing, or null if not found.
   */
  getById(id: string): Promise<NormalizedListing | null>;
}

export type ListingSearchResult = ListingSearchResponse;
export type ListingSearchPagination = ListingPagination;
