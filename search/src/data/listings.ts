export type ListingStatus = "FOR_SALE" | "PENDING" | "SOLD";
export type PropertyType = "Single Family" | "Condo" | "Multi-Family" | "Land";

export type Listing = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  neighborhood?: string;
  region: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lat: number;
  lng: number;
  photoUrl: string;
  status: ListingStatus;
  propertyType: PropertyType;
  daysOnMarket: number;
};

export const mockListings: Listing[] = [
  {
    id: "gr-001",
    addressLine1: "1250 Millwood Dr NE",
    city: "Grand Rapids",
    state: "MI",
    zip: "49505",
    neighborhood: "Creston",
    region: "West Michigan",
    price: 325_000,
    beds: 3,
    baths: 2,
    sqft: 1620,
    lat: 43.0025,
    lng: -85.6435,
    photoUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
    status: "FOR_SALE",
    propertyType: "Single Family",
    daysOnMarket: 3,
  },
  {
    id: "gr-002",
    addressLine1: "1580 Arbor Ln SE",
    city: "Grand Rapids",
    state: "MI",
    zip: "49506",
    neighborhood: "East Grand Rapids",
    region: "West Michigan",
    price: 625_000,
    beds: 4,
    baths: 3,
    sqft: 2480,
    lat: 42.9555,
    lng: -85.6005,
    photoUrl: "https://images.unsplash.com/photo-1600596542815-e32cb0656e21?auto=format&fit=crop&w=800&q=80",
    status: "FOR_SALE",
    propertyType: "Single Family",
    daysOnMarket: 7,
  },
  {
    id: "gr-003",
    addressLine1: "2227 Paris Ave SE",
    city: "Grand Rapids",
    state: "MI",
    zip: "49507",
    neighborhood: "Alger Heights",
    region: "West Michigan",
    price: 285_000,
    beds: 3,
    baths: 1.5,
    sqft: 1480,
    lat: 42.9265,
    lng: -85.643,
    photoUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    status: "PENDING",
    propertyType: "Single Family",
    daysOnMarket: 5,
  },
  {
    id: "gr-004",
    addressLine1: "1728 Mason St NE",
    city: "Grand Rapids",
    state: "MI",
    zip: "49503",
    neighborhood: "Midtown",
    region: "West Michigan",
    price: 349_900,
    beds: 3,
    baths: 2,
    sqft: 1710,
    lat: 42.978,
    lng: -85.65,
    photoUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    status: "FOR_SALE",
    propertyType: "Single Family",
    daysOnMarket: 1,
  },
  {
    id: "gr-005",
    addressLine1: "2865 32nd St SE",
    city: "Kentwood",
    state: "MI",
    zip: "49512",
    neighborhood: "Kentwood",
    region: "West Michigan",
    price: 259_900,
    beds: 3,
    baths: 1.5,
    sqft: 1405,
    lat: 42.911,
    lng: -85.583,
    photoUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80",
    status: "FOR_SALE",
    propertyType: "Single Family",
    daysOnMarket: 10,
  },
  {
    id: "gr-007",
    addressLine1: "2319 Union Ave SE",
    city: "Grand Rapids",
    state: "MI",
    zip: "49507",
    neighborhood: "Alger Heights",
    region: "West Michigan",
    price: 295_000,
    beds: 3,
    baths: 2,
    sqft: 1540,
    lat: 42.925,
    lng: -85.651,
    photoUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    status: "SOLD",
    propertyType: "Single Family",
    daysOnMarket: 4,
  },
];