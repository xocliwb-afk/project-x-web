// Canonical Types for Project X Monorepo

export interface ThemeConfig {
  brandName: string;
  colors: {
    primary: string;
    primaryAccent: string;
    background: string;
    surface: string;
    textMain: string;
    textMuted: string;
    border: string;
    danger: string;
    success: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: number;
    bodyWeight: number;
  };
}

export type ListingStatus = "FOR_SALE" | "PENDING" | "SOLD" | "OFF_MARKET";

export interface Listing {
  id: string;
  feedId: string;

  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    lat: number;
    lng: number;
    neighborhood?: string;
  };

  price: number;
  specs: {
    beds: number;
    baths: number;
    sqft: number;
    lotSizeAcres?: number;
    yearBuilt?: number;
    garageSpaces?: number;
    stories?: number;
  };

  features?: {
    basement?: "Finished" | "Unfinished" | "Partial" | "None";
    cooling?: string[];
    heating?: string[];
  };

  financials?: {
    hoaFee?: number;
  };

  description?: string;

  thumbnailUrl: string;
  photos: string[];

  status: ListingStatus;
  propertyType: string;
  daysOnMarket: number;
  listDate: string;
  mlsId: string;
  attribution: string;
  disclaimer?: string;
}

export interface SearchRequest {
  // Existing basic filters
  query?: string;
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  status?: ListingStatus[];
  limit?: number;
  offset?: number;
  location?: {
    lat: number;
    lng: number;
    radiusMiles: number;
  };

  // --- Advanced filters expected by apps/api/src/routes/listings.route.ts ---

  // Size
  sqftMin?: number;
  sqftMax?: number;

  // Lot size (in acres)
  lotSizeMinAcres?: number;

  // Year built range
  yearBuiltMin?: number;
  yearBuiltMax?: number;

  // Days on market
  maxDaysOnMarket?: number;

  // Keyword search (e.g. "pool", "fixer upper")
  keywords?: string;

  // Garage / parking
  minGarageSpaces?: number;

  // HOA fee ceiling (e.g. max $/month)
  maxHoaFee?: number;

  // Stories / levels
  stories?: number;

  // Basement
  basement?: "Finished" | "Unfinished" | "Partial" | "None";

  // HVAC flags
  hasCentralAir?: boolean;
  hasForcedAir?: boolean;
}
