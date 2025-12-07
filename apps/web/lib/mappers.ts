import type { Listing as NormalizedListing } from "@project-x/shared-types";

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
  status: NormalizedListing["status"];
  propertyType: string;
  daysOnMarket: number;
  neighborhood?: string;
}

export function mapNormalizedToListing(l: NormalizedListing): Listing {
  return {
    id: l.id,
    price: l.price,
    addressLine1: l.address.street,
    city: l.address.city,
    state: l.address.state,
    zip: l.address.zip,
    beds: l.specs.beds,
    baths: l.specs.baths,
    sqft: l.specs.sqft,
    photoUrl: l.thumbnailUrl || l.photos[0] || "",
    lat: l.address.lat,
    lng: l.address.lng,
    status: l.status,
    propertyType: l.propertyType,
    daysOnMarket: l.daysOnMarket,
    neighborhood: l.address.neighborhood,
  };
}

export function mapNormalizedArrayToListings(
  list: NormalizedListing[]
): Listing[] {
  return list.map(mapNormalizedToListing);
}
