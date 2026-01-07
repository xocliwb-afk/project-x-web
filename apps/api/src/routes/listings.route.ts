import { Router } from 'express';
import { getListingProvider } from '../utils/provider.factory';
import { ListingSearchParams, NormalizedListing, ApiError } from '@project-x/shared-types';
import {
  clampLimit,
  hasAnyNonPagingFilter,
  parseBbox,
  stableSortListings,
  MAX_LIMIT,
  DEFAULT_LIMIT,
} from '../utils/listingSearch.util';

const router = Router();

/**
 * GET /api/listings
 *
 * Returns a paginated set of listings using the ListingProvider abstraction.
 */
router.get('/', async (req, res) => {
  try {
    const provider = getListingProvider();

    // req.query is an untyped object; cast carefully into ListingSearchParams
    const params: ListingSearchParams = {
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      bbox: typeof req.query.bbox === 'string' ? req.query.bbox : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      beds: req.query.beds
        ? Number(req.query.beds)
        : req.query.minBeds
        ? Number(req.query.minBeds)
        : undefined,
      baths: req.query.baths
        ? Number(req.query.baths)
        : req.query.minBaths
        ? Number(req.query.minBaths)
        : undefined,
      propertyType: typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined,
      sort: typeof req.query.sort === 'string' ? (req.query.sort as ListingSearchParams['sort']) : undefined,
      status: Array.isArray(req.query.status)
        ? (req.query.status as string[])
        : typeof req.query.status === 'string'
        ? (req.query.status as string).split(',').filter(Boolean)
        : undefined,
      minSqft: req.query.minSqft ? Number(req.query.minSqft) : undefined,
      maxSqft: req.query.maxSqft ? Number(req.query.maxSqft) : undefined,
      minYearBuilt: req.query.minYearBuilt ? Number(req.query.minYearBuilt) : undefined,
      maxYearBuilt: req.query.maxYearBuilt ? Number(req.query.maxYearBuilt) : undefined,
      maxDaysOnMarket: req.query.maxDaysOnMarket ? Number(req.query.maxDaysOnMarket) : undefined,
      keywords: typeof req.query.keywords === 'string' ? req.query.keywords : undefined,
    };

    const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
    const requestedLimit = clampLimit(params.limit);
    let limit = requestedLimit;

    // Validate bbox if provided; if missing, allow only when other filters exist
    let bboxString = params.bbox;
    try {
      if (bboxString) {
        const { minLng, minLat, maxLng, maxLat } = parseBbox(bboxString);
        bboxString = `${minLng},${minLat},${maxLng},${maxLat}`;
      } else {
        const hasFilters = hasAnyNonPagingFilter(params);
        if (!hasFilters && page > 1) {
          const error: ApiError = {
            error: true,
            message: 'bbox is required when paging without other filters',
            code: 'BAD_REQUEST',
            status: 400,
          };
          return res.status(400).json(error);
        }
        // Cap limit when bbox is missing regardless of page to protect providers
        if (limit > DEFAULT_LIMIT) {
          limit = DEFAULT_LIMIT;
        }
      }
    } catch (bboxErr: any) {
      const error: ApiError = {
        error: true,
        message: bboxErr?.message ?? 'Invalid bbox',
        code: 'BAD_REQUEST',
        status: 400,
      };
      return res.status(400).json(error);
    }

    const providerLimit = Math.min(limit + 1, MAX_LIMIT + 1);

    const resultsRaw: NormalizedListing[] = await provider.search({
      ...params,
      bbox: bboxString,
      page,
      limit: providerLimit,
      clientLimit: limit,
    });

    const sorted = stableSortListings(resultsRaw, params.sort);
    const hasMore = sorted.length > limit;
    const results = sorted.slice(0, limit);

    res.json({
      results,
      pagination: {
        page,
        limit,
        pageCount: results.length,
        hasMore,
      },
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
 * GET /api/listings/:id
 *
 * Returns a single listing by ID or a 404 error if not found.
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
