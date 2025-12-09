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
    lat: number;
    lng: number;
  };
  media: {
    photos: string[];
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

/**
 * Defines the available query parameters for searching listings.
 * This type should be used by the backend for parsing and validating query strings.
 */
export type ListingSearchParams = {
  bbox?: string; // "minLng,minLat,maxLng,maxLat"
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  sort?: "price-asc" | "price-desc" | "dom" | "newest";
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
