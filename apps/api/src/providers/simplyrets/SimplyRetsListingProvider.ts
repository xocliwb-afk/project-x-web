import {
  ListingProvider,
  ListingSearchPagination,
  ListingSearchResult,
} from '../listing-provider.interface';
import { ListingSearchParams, NormalizedListing } from '@project-x/shared-types';
import { SimplyRetsClient } from './simplyrets.client';
import { mapSimplyRetsListing } from './simplyrets.mapper';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const STATUS_QUERY_MAP: Record<string, string> = {
  FOR_SALE: 'Active',
  PENDING: 'Pending',
  SOLD: 'Closed',
};

const PROPERTY_TYPE_QUERY_MAP: Record<string, string> = {
  'SINGLE FAMILY': 'RES',
  CONDO: 'CND',
  RENTAL: 'RNT',
  RENT: 'RNT',
};

function clampPage(page?: number): number {
  if (!page || Number.isNaN(page) || page < 1) return 1;
  return Math.floor(page);
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

function parseBbox(bbox?: string): [number, number, number, number] | null {
  if (!bbox) return null;
  const parts = bbox.split(',').map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((p) => !Number.isFinite(p))) {
    return null;
  }
  const [minLng, minLat, maxLng, maxLat] = parts as [number, number, number, number];
  return [minLng, minLat, maxLng, maxLat];
}

function mapStatusFilters(status?: string[]): string | undefined {
  if (!status || status.length === 0) return undefined;
  const mapped = status
    .map((s) => STATUS_QUERY_MAP[s.toUpperCase()] || s)
    .filter(Boolean);
  if (!mapped.length) return undefined;
  return mapped.join(',');
}

function mapPropertyTypeFilter(propertyType?: string): string | undefined {
  if (!propertyType) return undefined;
  const key = propertyType.trim().toUpperCase();
  return PROPERTY_TYPE_QUERY_MAP[key];
}

function mapSort(sort?: ListingSearchParams['sort']): string | undefined {
  if (!sort) return undefined;
  const sortMap: Record<NonNullable<ListingSearchParams['sort']>, string> = {
    'price-asc': 'listprice',
    'price-desc': '-listprice',
    newest: '-listdate',
    dom: 'days_on_market',
  };
  return sortMap[sort];
}

function computePagination(
  headers: Headers,
  page: number,
  limit: number,
  resultCount: number,
): ListingSearchPagination {
  const offset = (page - 1) * limit;
  const totalHeader = headers.get('x-total-count');
  const linkHeader = headers.get('link') ?? '';
  const hasNextLink = linkHeader.toLowerCase().includes('rel="next"');
  const hasMore = hasNextLink || resultCount === limit;

  const parsedTotal = totalHeader ? Number(totalHeader) : NaN;
  const total = Number.isFinite(parsedTotal)
    ? parsedTotal
    : offset + resultCount + (hasMore ? 1 : 0);

  return {
    page,
    limit,
    total,
    hasMore,
    pageCount: resultCount,
  };
}

export class SimplyRetsListingProvider implements ListingProvider {
  private readonly client = new SimplyRetsClient();

  public async search(params: ListingSearchParams): Promise<ListingSearchResult> {
    const page = clampPage(params.page);
    const limit = clampLimit(params.limit);
    const offset = (page - 1) * limit;
    const bbox = parseBbox(params.bbox);

    const query: Record<string, string | number | string[] | undefined> = {
      limit,
      offset,
    };

    // Some MLS feeds ignore bbox; translate to polygon points for consistent geo filtering.
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      query.points = [
        `${minLat},${minLng}`,
        `${minLat},${maxLng}`,
        `${maxLat},${maxLng}`,
        `${maxLat},${minLng}`,
      ];
    }
    if (params.q || params.keywords) query.q = params.keywords ?? params.q;
    if (params.minPrice != null) query.minprice = params.minPrice;
    if (params.maxPrice != null) query.maxprice = params.maxPrice;
    if (params.beds != null) query.minbeds = params.beds;
    if (params.baths != null) query.minbaths = params.baths;
    if (params.minSqft != null) query.minarea = params.minSqft;
    if (params.maxSqft != null) query.maxarea = params.maxSqft;
    if (params.minYearBuilt != null) query.minyear = params.minYearBuilt;
    if (params.maxYearBuilt != null) query.maxyear = params.maxYearBuilt;
    if (params.maxDaysOnMarket != null) query.maxdom = params.maxDaysOnMarket;

    const status = mapStatusFilters(params.status);
    if (status) query.status = status;

    const propertyType = mapPropertyTypeFilter(params.propertyType);
    if (propertyType) query.type = propertyType;

    const sort = mapSort(params.sort);
    if (sort) query.sort = sort;

    const response = await this.client.getProperties(query);

    const mapped =
      response.data?.map((raw) => mapSimplyRetsListing(raw, { requireCoordinates: true })) || [];

    const results = mapped.filter((item): item is NonNullable<typeof item> => Boolean(item));
    const pagination = computePagination(response.headers, page, limit, results.length);

    return { results, pagination };
  }

  public async getById(id: string): Promise<NormalizedListing | null> {
    const response = await this.client.getPropertyById(id);

    if (response.status === 404 || !response.data) {
      return null;
    }

    const listing = mapSimplyRetsListing(response.data, { requireCoordinates: false });
    return listing;
  }
}
