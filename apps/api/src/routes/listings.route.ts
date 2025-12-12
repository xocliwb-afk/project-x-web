import { Router, type Request, type Response } from 'express';
import { getListingProvider } from '../utils/provider.factory';
import { ListingSearchParams, ApiError } from '@project-x/shared-types';
import { formatBbox, parseBbox } from '../utils/bbox';

const router = Router();
export const listingRouter = Router();

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const VALID_SORTS: ListingSearchParams['sort'][] = ['price-asc', 'price-desc', 'dom', 'newest'];

const toNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizePage = (value: number | undefined) => {
  if (!value || value < 1) return DEFAULT_PAGE;
  return value;
};

const normalizeLimit = (value: number | undefined) => {
  if (!value || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
};

const badRequest = (res: Response, message: string) =>
  res.status(400).json({
    error: true,
    message,
    code: 'INVALID_REQUEST',
    status: 400,
  } satisfies ApiError);

/**
 * GET /api/listings
 *
 * Returns a paginated set of listings using the ListingProvider abstraction.
 */
router.get('/', async (req, res) => {
  try {
    const provider = getListingProvider();

    const bboxParam = typeof req.query.bbox === 'string' ? req.query.bbox : undefined;
    const parsedBbox = parseBbox(bboxParam);

    if (!parsedBbox) {
      return badRequest(res, 'bbox is required and must be "minLng,minLat,maxLng,maxLat"');
    }

    const page = normalizePage(toNumber(req.query.page));
    const limit = normalizeLimit(toNumber(req.query.limit));

    const sort =
      typeof req.query.sort === 'string' && VALID_SORTS.includes(req.query.sort as ListingSearchParams['sort'])
        ? (req.query.sort as ListingSearchParams['sort'])
        : undefined;

    const params: ListingSearchParams = {
      bbox: formatBbox(parsedBbox),
      page,
      limit,
      minPrice: toNumber(req.query.minPrice),
      maxPrice: toNumber(req.query.maxPrice),
      beds: toNumber(req.query.beds),
      baths: toNumber(req.query.baths),
      propertyType: typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined,
      sort,
    };

    const searchResult = await provider.search(params);

    const total = searchResult.total ?? searchResult.results.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pagedResults = searchResult.results.slice(start, end);
    const hasMore = end < total;

    res.json({
      results: pagedResults,
      pagination: {
        page,
        limit,
        total,
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
 * GET /api/listing/:id (canonical) and /api/listings/:id (alias)
 *
 * Returns a single listing by ID or a 404 error if not found.
 */
const handleGetListing = async (req: Request, res: Response) => {
  try {
    const provider = getListingProvider();
    const { id } = req.params;

    const listing = await provider.getById(id);

    if (!listing) {
      const error: ApiError = {
        error: true,
        message: 'Listing not found',
        code: 'NOT_FOUND',
        status: 404,
      };
      return res.status(404).json(error);
    }

    res.json(listing);
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

router.get('/:id', handleGetListing);
listingRouter.get('/:id', handleGetListing);

export default router;
