import { Router } from 'express';
import { getListingProvider } from '../utils/provider.factory';
import {
  ListingPagination,
  ListingSearchParams,
  NormalizedListing,
  ApiError,
  ListingSearchResponse,
} from '@project-x/shared-types';
import { MockListingProvider } from '../providers/mock-listing.provider';

const router = Router();

/**
 * GET /api/listings
 *
 * Returns a paginated set of listings using the ListingProvider abstraction.
 */
router.get('/', async (req, res) => {
  const parseNumber = (value: unknown): number | undefined => {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  try {
    const provider = getListingProvider();
    const providerName = process.env.DATA_PROVIDER?.toLowerCase() ?? 'mock';
    const isDev = process.env.NODE_ENV !== 'production';
    const fallbackEnabled = process.env.DEV_FALLBACK_TO_MOCK === 'true';
    const canFallback = fallbackEnabled && providerName === 'simplyrets' && isDev;

    // req.query is an untyped object; cast carefully into ListingSearchParams
    const params: ListingSearchParams = {
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      bbox: typeof req.query.bbox === 'string' ? req.query.bbox : undefined,
      page: parseNumber(req.query.page),
      limit: parseNumber(req.query.limit),
      minPrice: parseNumber(req.query.minPrice),
      maxPrice: parseNumber(req.query.maxPrice),
      beds: parseNumber(req.query.beds ?? req.query.minBeds),
      baths: parseNumber(req.query.baths ?? req.query.minBaths),
      propertyType: typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined,
      sort:
        typeof req.query.sort === 'string'
          ? (req.query.sort as ListingSearchParams['sort'])
          : undefined,
      status: Array.isArray(req.query.status)
        ? (req.query.status as string[])
        : typeof req.query.status === 'string'
          ? (req.query.status as string).split(',').filter(Boolean)
          : undefined,
      minSqft: parseNumber(req.query.minSqft),
      maxSqft: parseNumber(req.query.maxSqft),
      minYearBuilt: parseNumber(req.query.minYearBuilt),
      maxYearBuilt: parseNumber(req.query.maxYearBuilt),
      maxDaysOnMarket: parseNumber(req.query.maxDaysOnMarket),
      keywords: typeof req.query.keywords === 'string' ? req.query.keywords : undefined,
    };

    let providerResults: ListingSearchResponse;
    try {
      providerResults = await provider.search(params);
    } catch (providerErr: any) {
      if (canFallback) {
        try {
          const fallback = new MockListingProvider();
          providerResults = await fallback.search(params);
          console.error(
            `[API] SimplyRETS provider failed (${providerErr?.message ?? providerErr}). Served mock listings instead because DEV_FALLBACK_TO_MOCK=true.`
          );
        } catch {
          throw providerErr;
        }
      } else {
        throw providerErr;
      }
    }

    const { results, pagination } = providerResults;

    const responsePagination: ListingPagination = {
      ...pagination,
      pageCount: pagination.pageCount ?? results.length,
    };

    res.json({
      results,
      pagination: responsePagination,
    });
  } catch (err: any) {
    const error: ApiError = {
      error: true,
      message: err?.message ?? 'Failed to fetch listings',
      code: 'INTERNAL_ERROR',
      status: 500,
    };
    res.status(500).json(error);
  }
});

/**
 * Listing detail handler (canonical mount: /api/listing/:id).
 * Also used as an explicit alias when mounted at /api/listings/:id.
 */
const getListingById = async (req: any, res: any) => {
  try {
    const provider = getListingProvider();
    const providerName = process.env.DATA_PROVIDER?.toLowerCase() ?? 'mock';
    const isDev = process.env.NODE_ENV !== 'production';
    const fallbackEnabled = process.env.DEV_FALLBACK_TO_MOCK === 'true';
    const canFallback = fallbackEnabled && providerName === 'simplyrets' && isDev;
    const { id } = req.params;

    const loadFromMock = async () => {
      const fallback = new MockListingProvider();
      return fallback.getById(id);
    };

    let listing: NormalizedListing | null = null;

    try {
      listing = await provider.getById(id);
    } catch (providerErr: any) {
      if (canFallback) {
        console.error(
          `[API] SimplyRETS detail fetch failed (${providerErr?.message ?? providerErr}); falling back to mock listing ${id} because DEV_FALLBACK_TO_MOCK=true.`
        );
        listing = await loadFromMock();
      } else {
        throw providerErr;
      }
    }

    if (!listing && canFallback) {
      listing = await loadFromMock();
    }

    if (!listing) {
      const error: ApiError = {
        error: true,
        message: 'Listing not found',
        code: 'NOT_FOUND',
        status: 404,
      };
      return res.status(404).json(error);
    }

    res.json({ listing });
  } catch (err: any) {
    const error: ApiError = {
      error: true,
      message: err?.message ?? 'Failed to fetch listing',
      code: 'INTERNAL_ERROR',
      status: 500,
    };
    res.status(500).json(error);
  }
};

router.get('/:id', getListingById);

export default router;
