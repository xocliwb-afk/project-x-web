import {
  ListingSearchPagination,
  ListingProvider,
  ListingSearchResult,
} from './listing-provider.interface';
import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';
import { mockListings } from '../data/mockListings';

const DEFAULT_LIMIT = 20;
const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * MockListingProvider uses static in-repo data and maps it into the NormalizedListing shape.
 * This is used for local development and demos without hitting a real IDX/MLS provider.
 */
export class MockListingProvider implements ListingProvider {
  public async search(params: ListingSearchParams): Promise<ListingSearchResult> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 50) : DEFAULT_LIMIT;

    // For now, ignore most filters and just return all mock listings mapped.
    const mapped = mockListings
      .map((raw) => this.mapToListing(raw))
      .filter(
        (item): item is NormalizedListing =>
          Boolean(item) &&
          item.address.lat !== null &&
          item.address.lng !== null,
      );

    const total = mapped.length;
    const start = (page - 1) * limit;
    const pageResults = mapped.slice(start, start + limit);
    const pagination: ListingSearchPagination = {
      page,
      limit,
      total,
      hasMore: start + pageResults.length < total,
      pageCount: pageResults.length,
    };

    return { results: pageResults, pagination };
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
    const listPrice: number = raw.listPrice ?? raw.listprice ?? 0;

    const rawFull =
      raw.address?.full ??
      raw.address ??
      `${raw.streetName ?? ''} ${raw.streetNumber ?? ''}`.trim();

    const fullAddress =
      typeof rawFull === 'string' && rawFull.trim().length > 0
        ? rawFull
        : 'Unknown address';

    // Very simple street/city/state/zip extraction for mock data.
    // In real providers, this should use the actual address object.
    const parts = fullAddress.split(',').map((s: string) => s.trim());
    const streetPart = parts[0] ?? fullAddress;
    const cityPart = parts[1] ?? 'Unknown City';
    const stateZipPart = parts[2] ?? '';
    const [statePart, zipPart] = stateZipPart.split(' ').map((s: string) => s.trim());

    return {
      id: raw.listingId ?? raw.id ?? 'unknown-id',
      mlsId: raw.mlsId ?? 'unknown-mls-id',
      listPrice,
      listPriceFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(listPrice),
      address: {
        full: fullAddress,
        street: streetPart || fullAddress,
        city: cityPart || 'Unknown City',
        state: statePart || 'XX',
        zip: zipPart || '00000',
        lat: toNumber(raw.geo?.lat ?? raw.latitude),
        lng: toNumber(raw.geo?.lng ?? raw.longitude),
      },
      media: {
        photos: Array.isArray(raw.photos) ? raw.photos : [],
        thumbnailUrl:
          Array.isArray(raw.photos) && raw.photos.length > 0 ? raw.photos[0] : null,
      },
      details: {
        beds: raw.property?.bedrooms ?? raw.bedrooms ?? null,
        baths:
          (raw.property?.bathsFull ?? raw.bathsFull ?? 0) +
            (raw.property?.bathsHalf ?? raw.bathsHalf ?? 0) * 0.5 || null,
        sqft: raw.property?.area ?? raw.squareFeet ?? null,
        lotSize: raw.property?.lotSizeArea ?? raw.lotSize ?? null,
        yearBuilt: raw.property?.yearBuilt ?? raw.yearBuilt ?? null,
        hoaFees: raw.association?.fee ?? raw.hoaFees ?? null,
        basement:
          Array.isArray(raw.property?.basement) && raw.property.basement.length > 0
            ? raw.property.basement.join(', ')
            : raw.basement ?? null,
        propertyType: raw.property?.style ?? raw.property?.type ?? null,
        status: raw.mls?.status ?? raw.status ?? 'Active',
      },
      meta: {
        daysOnMarket: raw.mls?.daysOnMarket ?? null,
        mlsName: raw.mls?.isMls ?? 'Mock MLS',
      },
    };
  }
}
