import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';

export type ListingSearchResult = {
  results: NormalizedListing[];
  total: number;
};

/**
 * ListingProvider abstracts the underlying data source (mock, SimplyRETS, etc.)
 * and always returns normalized listings.
 */
export interface ListingProvider {
  /**
   * Searches for listings based on a set of criteria.
   * @param params - The search parameters (bbox, price range, beds, baths, etc.).
   * @returns A promise that resolves to the filtered listings and total count.
   */
  search(params: ListingSearchParams): Promise<ListingSearchResult>;

  /**
   * Retrieves a single listing by its unique ID.
   * @param id - The unique identifier for the listing.
   * @returns A promise that resolves to a normalized listing, or null if not found.
   */
  getById(id: string): Promise<NormalizedListing | null>;
}
