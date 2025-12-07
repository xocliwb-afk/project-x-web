import { IListingProvider } from "./listing-provider.interface";
import { Listing, ListingStatus, SearchRequest } from "@project-x/shared-types";

const DEFAULT_BASE_URL = "https://api.simplyrets.com";

function getAuthHeader(): string {
  // Use env vars if present, otherwise fall back to demo keys
  const key = process.env.SIMPLYRETS_API_KEY || "simplyrets";
  const secret = process.env.SIMPLYRETS_API_SECRET || "simplyrets";

  const raw = `${key}:${secret}`;
  const encoded = Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

function mapStatus(rawStatus: unknown): ListingStatus {
  const s = String(rawStatus || "").toUpperCase();
  if (s === "ACTIVE") return "FOR_SALE";
  if (s === "PENDING") return "PENDING";
  if (s === "SOLD" || s === "CLOSED") return "SOLD";
  return "OFF_MARKET";
}

function normalizeListing(raw: any): Listing {
  const street =
    raw?.address?.full ||
    `${raw?.address?.streetNumberText || ""} ${raw?.address?.streetName || ""}`.trim();

  const lat = raw?.geo?.lat ?? 0;
  const lng = raw?.geo?.lng ?? 0;

  const photos: string[] = Array.isArray(raw?.photos) ? raw.photos : [];
  const firstPhoto = photos[0] || "";

  return {
    id: String(raw?.mlsId ?? raw?.listingId ?? ""),
    feedId: "SIMPLYRETS",
    address: {
      street: street || "",
      city: raw?.address?.city || "",
      state: raw?.address?.state || "",
      zip: raw?.address?.postalCode || "",
      lat,
      lng,
      neighborhood: raw?.address?.subdivision || undefined,
    },
    price: raw?.listPrice ?? 0,
    specs: {
      beds: raw?.property?.bedrooms ?? 0,
      baths: raw?.property?.bathrooms ?? 0,
      sqft: raw?.property?.area ?? 0,
      lotSizeAcres: raw?.lot?.size ?? undefined,
      yearBuilt: raw?.property?.yearBuilt ?? undefined,
    },
    thumbnailUrl: firstPhoto,
    photos,
    status: mapStatus(raw?.mls?.status),
    propertyType: raw?.property?.type || "Unknown",
    daysOnMarket: raw?.mls?.daysOnMarket ?? 0,
    listDate: raw?.listDate || new Date().toISOString(),
    mlsId: String(raw?.mlsId ?? ""),
    attribution: raw?.disclaimer || "Courtesy of SimplyRETS Demo",
    disclaimer: raw?.disclaimer,
  };
}

function buildSearchUrl(request: SearchRequest): string {
  const baseUrl = process.env.SIMPLYRETS_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL("/properties", baseUrl);

  if (request.query) {
    url.searchParams.set("q", request.query);
  }
  if (request.priceMin != null) {
    url.searchParams.set("minprice", String(request.priceMin));
  }
  if (request.priceMax != null) {
    url.searchParams.set("maxprice", String(request.priceMax));
  }
  if (request.bedsMin != null) {
    url.searchParams.set("minbeds", String(request.bedsMin));
  }
  if (request.limit != null) {
    url.searchParams.set("limit", String(request.limit));
  }

  return url.toString();
}

export class SimplyRetsListingProvider implements IListingProvider {
  private readonly authHeader: string;

  constructor() {
    this.authHeader = getAuthHeader();
  }

  async searchListings(request: SearchRequest): Promise<Listing[]> {
    const url = buildSearchUrl(request);

    console.log(`[SimplyRETS] Fetching: ${url}`);

    const resp = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!resp.ok) {
      console.error(`[SimplyRETS] Error ${resp.status}: ${resp.statusText}`);
      throw new Error(`SimplyRETS failed with status ${resp.status}`);
    }

    const data = await resp.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(normalizeListing);
  }

  async getListingById(id: string): Promise<Listing | null> {
    // Demo-friendly: search by ID then filter
    const url = buildSearchUrl({ query: id });

    const resp = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    if (!Array.isArray(data)) return null;

    const raw = data.find(
      (item: any) =>
        String(item?.mlsId ?? "") === String(id) ||
        String(item?.listingId ?? "") === String(id)
    );

    return raw ? normalizeListing(raw) : null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = buildSearchUrl({ limit: 1 });
      const resp = await fetch(url, {
        headers: { Authorization: this.authHeader },
      });
      return resp.ok;
    } catch (e) {
      console.error("[SimplyRETS] Health Check Failed", e);
      return false;
    }
  }
}

