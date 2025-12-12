import { ListingProvider } from './listing-provider.interface';
import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';
import { mockListings } from '../data/mockListings';

/**
 * MockListingProvider uses static in-repo data and maps it into the NormalizedListing shape.
 * This is used for local development and demos without hitting a real IDX/MLS provider.
 */
export class MockListingProvider implements ListingProvider {
  public async search(params: ListingSearchParams): Promise<NormalizedListing[]> {
    const mapped = mockListings.map((raw) => this.mapToListing(raw));
    const filtered = mapped.filter((listing) => this.applyFilters(listing, params));
    return filtered;
  }

  public async getById(id: string): Promise<NormalizedListing | null> {
    const raw = mockListings.find((item) => item.id === id);

    if (!raw) {
      return null;
    }

    return this.mapToListing(raw);
  }

  /**
   * Maps a raw mock listing into the NormalizedListing DTO.
   * This is intentionally tolerant and uses fallback values for fields that may not exist in the mock.
   */
  private mapToListing(raw: any): NormalizedListing {
    const listPrice: number = raw.details?.price ?? raw.listPrice ?? raw.listprice ?? 0;

    const streetPart = raw.address?.street ?? 'Unknown street';
    const cityPart = raw.address?.city ?? 'Unknown City';
    const statePart = raw.address?.state ?? 'XX';
    const zipPart = raw.address?.zip ?? '00000';
    const fullAddress =
      raw.address?.full ??
      `${streetPart}, ${cityPart}, ${statePart} ${zipPart}`.trim();

    return {
      id: raw.listingId ?? raw.id ?? 'unknown-id',
      mlsId: raw.meta?.mlsId ?? raw.mlsId ?? 'unknown-mls-id',
      listPrice,
      listPriceFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(listPrice),
      address: {
        full: fullAddress,
        street: streetPart,
        city: cityPart,
        state: statePart,
        zip: zipPart,
        lat: raw.coordinates?.lat ?? raw.geo?.lat ?? raw.latitude ?? 0,
        lng: raw.coordinates?.lng ?? raw.geo?.lng ?? raw.longitude ?? 0,
      },
      media: {
        photos: Array.isArray(raw.media?.photos) ? raw.media.photos : [],
        thumbnailUrl: Array.isArray(raw.media?.photos) ? raw.media.photos[0] ?? null : null,
      },
      details: {
        beds: raw.details?.beds ?? null,
        baths: raw.details?.baths ?? null,
        sqft: raw.details?.sqft ?? null,
        lotSize: raw.details?.lotSize ?? null,
        yearBuilt: raw.details?.yearBuilt ?? null,
        hoaFees: raw.details?.hoaFees ?? null,
        basement: raw.details?.basement ?? null,
        propertyType: raw.details?.propertyType ?? null,
        status: raw.details?.status ?? 'Unknown',
      },
      meta: {
        daysOnMarket: raw.meta?.daysOnMarket ?? null,
        mlsName: raw.meta?.mlsName ?? null,
      },
    };
  }

  private applyFilters(listing: NormalizedListing, params: ListingSearchParams): boolean {
    if (params.q) {
      const q = params.q.toLowerCase();
      const haystack = `${listing.address.street} ${listing.address.city} ${listing.address.state} ${listing.address.zip}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (params.bbox) {
      const parts = params.bbox.split(',').map((p) => Number(p));
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        const { lat, lng } = listing.address;
        if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) return false;
      }
    }

    if (params.minPrice != null && listing.listPrice < params.minPrice) return false;
    if (params.maxPrice != null && listing.listPrice > params.maxPrice) return false;

    if (params.beds != null) {
      const beds = listing.details.beds ?? 0;
      if (beds < params.beds) return false;
    }

    if (params.baths != null) {
      const baths = listing.details.baths ?? 0;
      if (baths < params.baths) return false;
    }

    if (params.propertyType && listing.details.propertyType) {
      if (listing.details.propertyType !== params.propertyType) return false;
    }

    if (params.status?.length && listing.details.status) {
      if (!params.status.includes(listing.details.status)) return false;
    }

    if (params.minSqft != null) {
      const sqft = listing.details.sqft ?? 0;
      if (sqft < params.minSqft) return false;
    }

    if (params.maxSqft != null) {
      const sqft = listing.details.sqft ?? 0;
      if (sqft > params.maxSqft) return false;
    }

    if (params.minYearBuilt != null) {
      const year = listing.details.yearBuilt ?? 0;
      if (year < params.minYearBuilt) return false;
    }

    if (params.maxYearBuilt != null) {
      const year = listing.details.yearBuilt ?? 0;
      if (year > params.maxYearBuilt) return false;
    }

    if (params.maxDaysOnMarket != null) {
      const dom = listing.meta.daysOnMarket ?? 0;
      if (dom > params.maxDaysOnMarket) return false;
    }

    return true;
  }
}
