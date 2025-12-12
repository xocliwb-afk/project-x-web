import { Router, type Request, type Response } from 'express';
import { getListingProvider } from '../utils/provider.factory';
import {
  ListingSearchParams,
  NormalizedListing,
  ApiError,
} from '@project-x/shared-types';

const router = Router();

export async function getListings(req: Request, res: Response) {
  try {
    const provider = getListingProvider();

    const parsedLimit =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const parsedPage =
      typeof req.query.page === 'string' ? Number(req.query.page) : undefined;

    const limit = Math.max(1, Math.min(parsedLimit ?? 20, 50));
    const page = Math.max(1, parsedPage ?? 1);
    const start = (page - 1) * limit;
    const end = start + limit;

    const params: ListingSearchParams = {
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      bbox: typeof req.query.bbox === 'string' ? req.query.bbox : undefined,
      page,
      limit,
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
      propertyType:
        typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined,
      sort:
        typeof req.query.sort === 'string'
          ? (req.query.sort as ListingSearchParams['sort'])
          : undefined,
      status: Array.isArray(req.query.status)
        ? (req.query.status as string[])
        : typeof req.query.status === 'string'
        ? (req.query.status as string).split(',').filter(Boolean)
        : undefined,
      minSqft: req.query.minSqft ? Number(req.query.minSqft) : undefined,
      maxSqft: req.query.maxSqft ? Number(req.query.maxSqft) : undefined,
      minYearBuilt: req.query.minYearBuilt ? Number(req.query.minYearBuilt) : undefined,
      maxYearBuilt: req.query.maxYearBuilt ? Number(req.query.maxYearBuilt) : undefined,
      maxDaysOnMarket: req.query.maxDaysOnMarket
        ? Number(req.query.maxDaysOnMarket)
        : undefined,
      keywords: typeof req.query.keywords === 'string' ? req.query.keywords : undefined,
    };

    // Provider should not paginate; ensure page/limit are not used for slicing downstream.
    const { page: _p, limit: _l, ...providerParams } = params;
    const allResults: NormalizedListing[] = await provider.search(providerParams);

    const total = allResults.length;
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
}

export async function getListingById(req: Request, res: Response) {
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
}

router.get('/', getListings);
router.get('/:id', getListingById);

export default router;
