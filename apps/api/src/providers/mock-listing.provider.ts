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
    const listPrice: number = raw.listPrice ?? raw.listprice ?? 0;

    const fullAddress: string =
      raw.address?.full ??
      raw.address ??
      ((`${raw.streetName ?? ''} ${raw.streetNumber ?? ''}`.trim()) || 'Unknown address');

    // Very simple street/city/state/zip extraction for mock data.
    // In real providers, this should use the actual address object.
    const [streetPart, cityPart, stateZipPart] = fullAddress.split(',').map((s: string) => s.trim());
    const [statePart, zipPart] = (stateZipPart || '').split(' ').map((s: string) => s.trim());

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
        lat: raw.geo?.lat ?? raw.latitude ?? 0,
        lng: raw.geo?.lng ?? raw.longitude ?? 0,
      },
      media: {
        photos: Array.isArray(raw.photos) ? raw.photos : [],
      },
      details: {
        beds: raw.property?.bedrooms ?? raw.bedrooms ?? null,
        baths:
          (raw.property?.bathsFull ?? raw.bathsFull ?? 0) +
          (raw.property?.bathsHalf ?? raw.bathsHalf ?? 0) * 0.5,
        sqft: raw.property?.area ?? raw.squareFeet ?? null,
        lotSize: raw.property?.lotSizeArea ?? raw.lotSize ?? null,
        yearBuilt: raw.property?.yearBuilt ?? raw.yearBuilt ?? null,
        hoaFees: raw.association?.fee ?? raw.hoaFees ?? null,
        basement:
          Array.isArray(raw.property?.basement) && raw.property.basement.length > 0
            ? raw.property.basement.join(', ')
            : raw.basement ?? null,
        propertyType: raw.property?.style ?? raw.property?.type ?? 'Unknown',
        status: raw.mls?.status ?? raw.status ?? 'Active',
      },
      meta: {
        daysOnMarket: raw.mls?.daysOnMarket ?? null,
        mlsName: raw.mls?.isMls ?? 'Mock MLS',
      },
    };
  }
}
