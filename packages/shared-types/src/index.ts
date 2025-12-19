/**
 * The canonical, normalized data transfer object for a single property listing.
 * This shape is used for all API responses to web and mobile clients.
 */
export type NormalizedListing = {
  id: string;
  mlsId: string;
  listPrice: number;
  listPriceFormatted: string;
  address: {
    full: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    lat: number | null;
    lng: number | null;
  };
  media: {
    photos: string[];
    thumbnailUrl?: string | null;
  };
  attribution?: {
    mlsName: string;
    disclaimer: string;
    logoUrl?: string | null;
  };
  details: {
    beds: number | null;
    baths: number | null;
    sqft: number | null;
    lotSize: number | null;
    yearBuilt: number | null;
    hoaFees: number | null;
    basement: string | null;
    propertyType: string | null;
    status: string;
  };
  meta: {
    daysOnMarket: number | null;
    mlsName: string | null;
  };
};

/**
 * A semantic alias for the canonical listing DTO.
 * Existing code that imports `Listing` should now receive the normalized shape.
 */
export type Listing = NormalizedListing;

export type ListingPagination = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  /**
   * LEGACY: count of results in this response page (not total pages).
   * New consumers should rely on `total` + `hasMore`.
   */
  pageCount?: number;
};

export type ListingSearchResponse = {
  results: NormalizedListing[];
  pagination: ListingPagination;
};

/**
 * Defines the available query parameters for searching listings.
 * This type should be used by the backend for parsing and validating query strings.
 */
export type ListingSearchParams = {
  q?: string;
  bbox?: string; // "minLng,minLat,maxLng,maxLat"
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  sort?: "price-asc" | "price-desc" | "dom" | "newest";
  status?: string[]; // e.g. ["FOR_SALE", "PENDING"]
  minSqft?: number;
  maxSqft?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  maxDaysOnMarket?: number;
  keywords?: string;
};

/**
 * A standardized error shape for API responses.
 * All error responses from the API should conform to this structure.
 */
export type ApiError = {
  error: true;
  message: string;
  code: string;
  status: number;
};

export type CRMType =
  | 'null'
  | 'webhook'
  | 'hubspot'
  | 'gohighlevel'
  | 'followupboss'
  | 'email';

export type CRMConfig = {
  brokerId: string;
  crmType: CRMType;
  webhookUrl?: string;
  webhookSecret?: string;
  apiKey?: string;
  metadata?: Record<string, string | number>;
};

export type LeadPayload = {
  listingId: string;
  listingAddress?: string;
  message?: string;
  name: string;
  email: string;
  phone?: string;
  brokerId: string;
  agentId?: string;
  source: 'project-x-web' | 'project-x-app';
};

export type LeadResponse = {
  success: boolean;
};

// TEMP: keep contract-safe and serializable. Status / propertyType are strings in the API.
export type ListingStatus = string;
export type PropertyType = string;

export * from './tour';
