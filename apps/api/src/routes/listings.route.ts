import { Router } from 'express';
import { getListingProvider } from '../utils/provider.factory';
import {
  ListingPagination,
  ListingSearchParams,
  NormalizedListing,
  ApiError,
} from '@project-x/shared-types';

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

    const { results, pagination } = await provider.search(params);

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
    const { id } = req.params;

    const listing: NormalizedListing | null = await provider.getById(id);

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
