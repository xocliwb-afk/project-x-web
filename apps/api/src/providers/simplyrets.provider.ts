import { ListingProvider } from './listing-provider.interface';
import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';

export class SimplyRetsListingProvider implements ListingProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor() {
    this.baseUrl = process.env.SIMPLYRETS_BASE_URL ?? 'https://api.simplyrets.com';

    const username = process.env.SIMPLYRETS_USERNAME;
    const password = process.env.SIMPLYRETS_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'SIMPLYRETS_USERNAME and SIMPLYRETS_PASSWORD must be set when using SimplyRetsListingProvider',
      );
    }

    const token = Buffer.from(`${username}:${password}`).toString('base64');
    this.authHeader = `Basic ${token}`;
  }

  public async search(params: ListingSearchParams): Promise<NormalizedListing[]> {
    const url = new URL('/properties', this.baseUrl);

    if (params.limit) url.searchParams.set('limit', String(params.limit));
    if (params.q) url.searchParams.set('q', params.q);
    if (params.minPrice) url.searchParams.set('minprice', String(params.minPrice));
    if (params.maxPrice) url.searchParams.set('maxprice', String(params.maxPrice));
    if (params.beds) url.searchParams.set('minbeds', String(params.beds));
    if (params.baths) url.searchParams.set('minbaths', String(params.baths));
    if (params.propertyType) url.searchParams.set('type', params.propertyType);
    if (params.status && params.status.length > 0) {
      url.searchParams.set('status', params.status.join(','));
    }
    if (params.minSqft) url.searchParams.set('minarea', String(params.minSqft));
    if (params.maxSqft) url.searchParams.set('maxarea', String(params.maxSqft));
    if (params.minYearBuilt) url.searchParams.set('minyear', String(params.minYearBuilt));
    if (params.maxYearBuilt) url.searchParams.set('maxyear', String(params.maxYearBuilt));
    if (params.maxDaysOnMarket) url.searchParams.set('maxdom', String(params.maxDaysOnMarket));
    if (params.sort) {
      const sortMap: Record<NonNullable<ListingSearchParams['sort']>, string> = {
        'price-asc': 'listprice',
        'price-desc': '-listprice',
        newest: '-listdate',
        dom: 'days_on_market',
      };
      const mapped = sortMap[params.sort];
      if (mapped) {
        url.searchParams.set('sort', mapped);
      }
    }
    // MVP: ignore bbox, sort, page → offset mapping for now

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!res.ok) {
      throw new Error(`SimplyRETS search failed with status ${res.status}`);
    }

    const data = (await res.json()) as any[];

    const results: NormalizedListing[] = [];
    for (const raw of data) {
      try {
        results.push(this.mapToListing(raw));
      } catch (err) {
        console.error('[SimplyRetsListingProvider] Failed to map listing', {
          error: err,
          mlsId: raw?.mlsId,
          address: raw?.address?.full,
        });
      }
    }

    return results;
  }

  public async getById(id: string): Promise<NormalizedListing | null> {
    const url = new URL(`/properties/${id}`, this.baseUrl);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`SimplyRETS getById failed with status ${res.status}`);
    }

    const raw = await res.json();
    return this.mapToListing(raw);
  }

  private mapToListing(raw: any): NormalizedListing {
    const listPrice = raw.listPrice ?? 0;

    const fullBaths = raw.property?.bathsFull ?? 0;
    const halfBaths = raw.property?.bathsHalf ?? 0;
    const totalBaths =
      fullBaths > 0 || halfBaths > 0 ? fullBaths + halfBaths * 0.5 : null;

    return {
      id: String(raw.mlsId),
      mlsId: String(raw.mlsId),
      listPrice,
      listPriceFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(listPrice),
      address: {
        full: raw.address?.full ?? 'Address not available',
        street: `${raw.address?.streetNumberText ?? ''} ${raw.address?.streetName ?? ''}`.trim(),
        city: raw.address?.city ?? '',
        state: raw.address?.state ?? '',
        zip: raw.address?.postalCode ?? '',
        lat: raw.geo?.lat ?? 0,
        lng: raw.geo?.lng ?? 0,
      },
      media: {
        photos: Array.isArray(raw.photos) ? raw.photos : [],
      },
      details: {
        beds: raw.property?.bedrooms ?? null,
        baths: totalBaths,
        sqft: raw.property?.area ?? null,
        lotSize: raw.property?.lotSizeArea ?? null,
        yearBuilt: raw.property?.yearBuilt ?? null,
        hoaFees: raw.association?.fee ?? null,
        basement:
          Array.isArray(raw.property?.basement) && raw.property.basement.length > 0
            ? raw.property.basement.join(', ')
            : null,
        propertyType: raw.property?.style ?? raw.property?.type ?? 'Unknown',
        status: raw.mls?.status ?? 'Unknown',
      },
      meta: {
        daysOnMarket: raw.mls?.daysOnMarket ?? null,
        mlsName: 'SimplyRETS',
      },
    };
  }
}
