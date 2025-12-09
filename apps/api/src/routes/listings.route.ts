import { Router } from 'express';
import { getListingProvider } from '../utils/provider.factory';
import {
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
  try {
    const provider = getListingProvider();

    // req.query is an untyped object; cast carefully into ListingSearchParams
    const params: ListingSearchParams = {
      bbox: typeof req.query.bbox === 'string' ? req.query.bbox : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      beds: req.query.beds ? Number(req.query.beds) : undefined,
      baths: req.query.baths ? Number(req.query.baths) : undefined,
      propertyType: typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined,
      sort: typeof req.query.sort === 'string' ? (req.query.sort as ListingSearchParams['sort']) : undefined,
    };

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const allResults: NormalizedListing[] = await provider.search(params);
    const total = allResults.length;

    const start = (page - 1) * limit;
    const end = page * limit;
    const pagedResults = allResults.slice(start, end);

    res.json({
      results: pagedResults,
      pagination: {
        page,
        limit,
        total,
        hasMore: end < total,
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
router.get('/:id', async (req, res) => {
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
});

export default router;
