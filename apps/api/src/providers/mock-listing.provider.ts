import { ListingProvider } from './listing-provider.interface';
import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';
import { mockListings } from '../data/mockListings';

/**
 * MockListingProvider uses static in-repo data and maps it into the NormalizedListing shape.
 * This is used for local development and demos without hitting a real IDX/MLS provider.
 */
export class MockListingProvider implements ListingProvider {
  public async search(params: ListingSearchParams): Promise<NormalizedListing[]> {
    // For now, ignore most filters and just return all mock listings mapped.
    // Later we can add filtering by price, beds, etc.
    const mapped = mockListings.map((raw) => this.mapToListing(raw));

    if (process.env.NODE_ENV !== 'production') {
      const missingPrice = mapped.filter((l) => !Number.isFinite(l.listPrice) || l.listPrice <= 0).length;
      const missingCoords = mapped.filter(
        (l) => !Number.isFinite(l.address.lat) || !Number.isFinite(l.address.lng),
      ).length;
      if (missingPrice || missingCoords) {
        console.warn(
          `[MockListingProvider] mapped ${mapped.length} listings; missing price: ${missingPrice}; missing coords: ${missingCoords}`,
        );
      }
    }

    return mapped;
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
    const pickNumber = (...vals: any[]) =>
      vals.find((v) => typeof v === 'number' && Number.isFinite(v)) ?? null;

    const rawPrice = pickNumber(
      raw.listPrice,
      raw.listprice,
      raw.price,
      raw.details?.price,
      raw.details?.listPrice,
      raw.details?.listprice,
    );
    const listPrice: number = rawPrice ?? 0;

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
      media: {
        photos: Array.isArray(raw.media?.photos)
          ? raw.media.photos
          : Array.isArray(raw.photos)
          ? raw.photos
          : [],
        thumbnailUrl:
          (Array.isArray(raw.media?.photos) && raw.media.photos[0]) ||
          (Array.isArray(raw.photos) && raw.photos[0]) ||
          null,
      },
      address: {
        full: fullAddress,
        street: streetPart || fullAddress,
        city: cityPart || 'Unknown City',
        state: statePart || 'XX',
        zip: zipPart || '00000',
        lat: pickNumber(raw.address?.lat, raw.coordinates?.lat, raw.geo?.lat, raw.latitude) ?? 0,
        lng: pickNumber(raw.address?.lng, raw.coordinates?.lng, raw.geo?.lng, raw.longitude) ?? 0,
      },
      details: {
        beds: raw.property?.bedrooms ?? raw.details?.beds ?? raw.bedrooms ?? null,
        baths:
          (raw.property?.bathsFull ?? raw.bathsFull ?? 0) +
          (raw.property?.bathsHalf ?? raw.bathsHalf ?? 0) * 0.5,
        sqft: raw.property?.area ?? raw.details?.sqft ?? raw.squareFeet ?? null,
        lotSize: raw.property?.lotSizeArea ?? raw.details?.lotSize ?? raw.lotSize ?? null,
        yearBuilt: raw.property?.yearBuilt ?? raw.details?.yearBuilt ?? raw.yearBuilt ?? null,
        hoaFees: raw.association?.fee ?? raw.hoaFees ?? null,
        basement:
          Array.isArray(raw.property?.basement) && raw.property.basement.length > 0
            ? raw.property.basement.join(', ')
            : raw.basement ?? null,
        propertyType: raw.property?.style ?? raw.property?.type ?? raw.details?.propertyType ?? 'Unknown',
        status: raw.mls?.status ?? raw.status ?? raw.details?.status ?? 'Active',
      },
      meta: {
        daysOnMarket: raw.mls?.daysOnMarket ?? raw.meta?.daysOnMarket ?? null,
        mlsName: raw.mls?.isMls ?? raw.meta?.mlsName ?? 'Mock MLS',
      },
      agent: raw.agent ?? null,
      coAgent: raw.coAgent ?? null,
      office: raw.office ?? null,
      description: raw.description ?? raw.remarks ?? null,
      tax: raw.tax ?? null,
      school: raw.school ?? null,
    };
  }
}
