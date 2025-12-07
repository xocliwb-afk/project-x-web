import { IListingProvider } from "./listing-provider.interface";
import { Listing, SearchRequest } from "@project-x/shared-types";

const MOCK_LISTINGS: Listing[] = [
  {
    id: "gr-001",
    feedId: "MOCK-1",
    address: {
      street: "1250 Millwood Dr NE",
      city: "Grand Rapids",
      state: "MI",
      zip: "49505",
      lat: 43.0025,
      lng: -85.6435,
      neighborhood: "Creston",
    },
    price: 325000,
    specs: { beds: 3, baths: 2, sqft: 1620 },
    thumbnailUrl:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
    photos: [],
    status: "FOR_SALE",
    propertyType: "Single Family",
    daysOnMarket: 3,
    listDate: "2023-10-01",
    mlsId: "GR-12345",
    attribution: "Mock Data (Project X)",
    disclaimer: "Mock dataset for local development only.",
  },
  {
    id: "gr-002",
    feedId: "MOCK-2",
    address: {
      street: "1580 Arbor Ln SE",
      city: "Grand Rapids",
      state: "MI",
      zip: "49506",
      lat: 42.9555,
      lng: -85.6005,
      neighborhood: "East Grand Rapids",
    },
    price: 625000,
    specs: { beds: 4, baths: 3, sqft: 2480 },
    thumbnailUrl:
      "https://images.unsplash.com/photo-1600596542815-0ef3c08ba1ff?auto=format&fit=crop&w=800&q=80",
    photos: [],
    status: "FOR_SALE",
    propertyType: "Single Family",
    daysOnMarket: 7,
    listDate: "2023-10-05",
    mlsId: "GR-12346",
    attribution: "Mock Data (Project X)",
    disclaimer: "Mock dataset for local development only.",
  },
];

export class MockListingProvider implements IListingProvider {
  async searchListings(request: SearchRequest): Promise<Listing[]> {
    let results = [...MOCK_LISTINGS];

    if (request.priceMin != null) {
      results = results.filter((l) => l.price >= request.priceMin!);
    }
    if (request.priceMax != null) {
      results = results.filter((l) => l.price <= request.priceMax!);
    }
    if (request.bedsMin != null) {
      results = results.filter((l) => l.specs.beds >= request.bedsMin!);
    }
    if (request.status && request.status.length > 0) {
      results = results.filter((l) => request.status!.includes(l.status));
    }
    if (request.sqftMin != null) {
      results = results.filter((l) => l.specs.sqft >= request.sqftMin!);
    }
    if (request.sqftMax != null) {
      results = results.filter((l) => l.specs.sqft <= request.sqftMax!);
    }

    if (request.maxDaysOnMarket != null) {
      results = results.filter(
        (l) => l.daysOnMarket <= request.maxDaysOnMarket!
      );
    }

    if (request.keywords) {
      const kw = request.keywords.toLowerCase();
      results = results.filter((l) =>
        (l.description || "").toLowerCase().includes(kw)
      );
    }

    return results;
  }

  async getListingById(id: string): Promise<Listing | null> {
    return MOCK_LISTINGS.find((l) => l.id === id) || null;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
