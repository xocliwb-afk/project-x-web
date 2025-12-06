import type { NormalizedListing, ListingStatus, PropertyType } from "@project-x/shared-types";

export interface Listing {
  id: string;
  price: number;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  photoUrl: string;
  lat: number;
  lng: number;
  status: ListingStatus;
  propertyType: PropertyType;
  daysOnMarket: number;
  neighborhood: string | null;
}

export function mapNormalizedToListing(l: NormalizedListing): Listing {
  return {
    id: l.id,
    price: l.details.price,
    addressLine1: l.address.street,
    city: l.address.city,
    state: l.address.state,
    zip: l.address.zip,
    beds: l.details.beds,
    baths: l.details.baths,
    sqft: l.details.sqft,
    photoUrl: l.media.photos[0] || "",
    lat: l.coordinates.lat,
    lng: l.coordinates.lng,
    status: l.details.status,
    propertyType: l.details.propertyType,
    daysOnMarket: l.meta.daysOnMarket,
    neighborhood: l.address.neighborhood,
  };
}

export function mapNormalizedArrayToListings(list: NormalizedListing[]): Listing[] {
  return list.map(mapNormalizedToListing);
}