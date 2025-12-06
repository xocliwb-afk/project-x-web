export type ListingStatus = "FOR_SALE" | "PENDING" | "SOLD";
export type PropertyType = "Single Family" | "Condo" | "Multi-Family" | "Land";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string | null;
  county: string | null;
}

export interface Media {
  photos: string[];
  virtualTourUrl?: string;
}

export interface PropertyDetails {
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSize: number; // in acres
  yearBuilt: number;
  propertyType: PropertyType;
  status: ListingStatus;
  description: string;
}

export interface ListingMeta {
  daysOnMarket: number;
  mlsName: string;
  mlsId: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NormalizedListing {
  id: string;
  address: Address;
  media: Media;
  details: PropertyDetails;
  meta: ListingMeta;
  coordinates: Coordinates;
}

export interface ListingSearchParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  status?: ListingStatus;
  propertyType?: PropertyType;
  minSqft?: number;
  maxDaysOnMarket?: number;
}