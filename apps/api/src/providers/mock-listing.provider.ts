import { ListingProvider, ListingSearchResult } from './listing-provider.interface';
import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';
import { mockListings } from '../data/mockListings';
import { parseBbox } from '../utils/bbox';

/**
 * MockListingProvider uses static in-repo data and maps it into the NormalizedListing shape.
 * This is used for local development and demos without hitting a real IDX/MLS provider.
 */
export class MockListingProvider implements ListingProvider {
  public async search(params: ListingSearchParams): Promise<ListingSearchResult> {
    const parsedBbox = parseBbox(params.bbox);

    const filtered = mockListings.filter((raw) => {
      // bbox filter (required upstream, but guard defensively)
      if (parsedBbox) {
        const lat = raw.coordinates?.lat ?? raw.address?.lat;
        const lng = raw.coordinates?.lng ?? raw.address?.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return false;
        }
        if (
          lng < parsedBbox.minLng ||
          lng > parsedBbox.maxLng ||
          lat < parsedBbox.minLat ||
          lat > parsedBbox.maxLat
        ) {
          return false;
        }
      }

      // price filters
      if (params.minPrice != null) {
        if (raw.details?.price == null || raw.details.price < params.minPrice) {
          return false;
        }
      }
      if (params.maxPrice != null && (raw.details?.price == null || raw.details.price > params.maxPrice)) {
        return false;
      }

      // beds/baths
      if (params.beds != null && (raw.details?.beds ?? 0) < params.beds) {
        return false;
      }
      if (params.baths != null && (raw.details?.baths ?? 0) < params.baths) {
        return false;
      }

      if (params.propertyType && raw.details?.propertyType !== params.propertyType) {
        return false;
      }

      return true;
    });

    let mapped = filtered.map((raw) => this.mapToListing(raw));

    if (params.sort) {
      mapped = this.sortResults(mapped, params.sort);
    }

    return { results: mapped, total: mapped.length };
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
    const listPrice: number = raw.details?.price ?? 0;
    const street = raw.address?.street ?? '';
    const city = raw.address?.city ?? '';
    const state = raw.address?.state ?? '';
    const zip = raw.address?.zip ?? '';
    const fullAddress = [street, city, `${state} ${zip}`.trim()].filter(Boolean).join(', ');

    return {
      id: String(raw.id ?? raw.meta?.mlsId ?? 'unknown-id'),
      mlsId: String(raw.meta?.mlsId ?? raw.id ?? 'unknown-mls-id'),
      listPrice,
      listPriceFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(listPrice),
      address: {
        full: fullAddress || 'Unknown address',
        street: street || fullAddress || 'Unknown address',
        city: city || 'Unknown City',
        state: state || 'XX',
        zip: zip || '00000',
        lat: raw.coordinates?.lat ?? 0,
        lng: raw.coordinates?.lng ?? 0,
      },
      media: {
        photos: Array.isArray(raw.media?.photos) ? raw.media.photos : [],
        thumbnailUrl:
          Array.isArray(raw.media?.photos) && raw.media.photos.length > 0
            ? raw.media.photos[0]
            : null,
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

  private sortResults(listings: NormalizedListing[], sort: NonNullable<ListingSearchParams['sort']>) {
    const sorted = [...listings];

    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.listPrice - b.listPrice);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.listPrice - a.listPrice);
        break;
      case 'dom':
      case 'newest': {
        // Mock data lacks list dates; use daysOnMarket as the closest proxy (lower = newer).
        sorted.sort((a, b) => (a.meta.daysOnMarket ?? Infinity) - (b.meta.daysOnMarket ?? Infinity));
        break;
      }
      default:
        break;
    }

    return sorted;
  }
}
