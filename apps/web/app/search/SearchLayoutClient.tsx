'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Listing } from '@project-x/shared-types';
import type {
  FetchListingsParams,
  PaginatedListingsResponse,
} from '@/lib/api-client';
import { fetchListings } from '@/lib/api-client';
import { trackEvent } from '@/lib/analytics';
import Footer from '@/components/Footer';
import ListingsList from '@/components/ListingsList';
import { ListingDetailModal } from '@/components/ListingDetailModal';
import { useTheme } from '@/context/ThemeContext';

const MapboxMap = dynamic(() => import('@/components/map/mapbox/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-text-main/60">
      Loading map...
    </div>
  ),
});

type SearchLayoutClientProps = {
  initialListings: Listing[];
  initialPagination: PaginatedListingsResponse['pagination'];
};

type MapBounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  bbox?: string;
};

type PinHydrationStatus = 'idle' | 'running' | 'done' | 'capped' | 'aborted' | 'error';

type PinHydrationMeta = {
  cap: number;
  seeded: number;
  hydrated: number;
  aborted: number;
  errors: number;
};

const ENABLE_PIN_HYDRATION = true;
const PIN_HYDRATION_HARD_CAP = 2000;
const LOW_LIMIT_THRESHOLD = 200;
const MAX_PIN_PAGES_PER_APPLY_FAILSAFE = 6;
const ABSOLUTE_MAX_PIN_PAGES = 12;
const PIN_HYDRATION_PAGE_LIMIT = 500;
const FIRST_PIN_REQUEST_DELAY = 750;
const MIN_DELAY_BETWEEN_PIN_REQUESTS = 500;

const buildPinListingsMap = (source: Listing[]) => {
  const map = new Map<string, Listing>();
  for (const listing of source) {
    const listingId = listing.id ?? listing.mlsId;
    const key = listingId != null ? listingId.toString() : null;
    if (!key || map.has(key)) continue;
    map.set(key, listing);
  }
  return map;
};

export default function SearchLayoutClient({
  initialListings,
  initialPagination,
}: SearchLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mapSide, paneDominance } = useTheme();
  // Mapbox-only: Leaflet fallback disabled in this PR to avoid feature-flag drift.
  const useMapbox = true;
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [pagination, setPagination] =
    useState<PaginatedListingsResponse['pagination']>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [draftBounds, setDraftBounds] = useState<MapBounds | null>(null);
  const [boundsWaitTimedOut, setBoundsWaitTimedOut] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedParamsKeyRef = useRef<string | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const autoFillControllerRef = useRef<AbortController | null>(null);
  const baseQueryKeyRef = useRef<string | null>(null);
  const baseQueryInvariantWarnedRef = useRef(false);
  const lastParamsKeyRef = useRef<string | null>(null);
  const lastBaseQueryKeyRef = useRef<string | null>(null);
  const pinHydrationControllerRef = useRef<AbortController | null>(null);
  const pinHydrationRunIdRef = useRef(0);
  const pinHydrationCapRef = useRef<number>(PIN_HYDRATION_HARD_CAP);
  const clampWarnedBaseKeyRef = useRef<string | null>(null);
  const lastPinHydrationBaseKeyRef = useRef<string | null>(null);
  const hasCompletedInitialFetch = useRef(false);
  const didAutoApplyInitialBoundsRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const autofillRequestIdRef = useRef(0);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const CARDS_PER_PAGE = 25;
  const [listPage, setListPage] = useState(1);

  const TARGET_RESULTS = 100;
  const PAGE_SIZE = 50;
  const initialPinListingsMap = useMemo(
    () => buildPinListingsMap(initialListings),
    [initialListings],
  );
  const [pinHydrationStatus, setPinHydrationStatus] =
    useState<PinHydrationStatus>('idle');
  const [pinHydrationMeta, setPinHydrationMeta] = useState<PinHydrationMeta>({
    cap: PIN_HYDRATION_HARD_CAP,
    seeded: initialPinListingsMap.size,
    hydrated: 0,
    aborted: 0,
    errors: 0,
  });
  const [pinListingsById, setPinListingsById] = useState<Map<string, Listing>>(
    () => initialPinListingsMap,
  );

  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const inFlightPagesRef = useRef<Set<string>>(new Set());
  const loadedPagesRef = useRef<Set<string>>(new Set());
  const autofillKeyRef = useRef<string | null>(null);
  const autofillRunningRef = useRef(false);
  const listingsRef = useRef(listings);
  const pinListingsByIdRef = useRef(pinListingsById);
  const isAutoFillingRef = useRef(isAutoFilling);
  const isLoadingMoreRef = useRef(isLoadingMore);

  const MapComponent = MapboxMap;

  const pinListings = useMemo(
    () => Array.from(pinListingsById.values()),
    [pinListingsById],
  );

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    pinListingsByIdRef.current = pinListingsById;
  }, [pinListingsById]);

  useEffect(() => {
    isAutoFillingRef.current = isAutoFilling;
  }, [isAutoFilling]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  const pinCount = useMemo(
    () =>
      pinListings.filter(
        (l) => Number.isFinite(l.address?.lat) && Number.isFinite(l.address?.lng),
      ).length,
    [pinListings],
  );
  const pinHydrationSuffix = useMemo(() => {
    if (pinHydrationStatus === 'running') return '(hydrating...)';
    if (pinHydrationStatus === 'capped')
      return `(capped at ${pinHydrationMeta.cap.toLocaleString()})`;
    if (pinHydrationStatus === 'error') return '(error)';
    return '';
  }, [pinHydrationStatus, pinHydrationMeta.cap]);

  const hasAnyNonPagingFilterFrontend = useCallback((p: FetchListingsParams) => {
    return Boolean(
      p.q ||
        p.minPrice != null ||
        p.maxPrice != null ||
        p.beds != null ||
        p.baths != null ||
        p.propertyType ||
        (p.status && p.status.length > 0) ||
        p.minSqft != null ||
        p.maxSqft != null ||
        p.minYearBuilt != null ||
        p.maxYearBuilt != null ||
        p.maxDaysOnMarket != null ||
        p.keywords,
    );
  }, []);

  const parsedParams = useMemo<FetchListingsParams>(() => {
    const getNumber = (key: string) => {
      const value = searchParams.get(key);
      return value != null && value !== '' ? Number(value) : undefined;
    };

    const statusParam = searchParams.getAll('status');
    const singleStatus = searchParams.get('status');
    const statusArray =
      statusParam.length > 0
        ? statusParam
        : singleStatus
        ? singleStatus.split(',').filter(Boolean)
        : undefined;

    return {
      q: searchParams.get('q') || undefined,
      bbox: searchParams.get('bbox') || undefined,
      page: getNumber('page'),
      limit: getNumber('limit'),
      minPrice: getNumber('minPrice'),
      maxPrice: getNumber('maxPrice'),
      beds: getNumber('beds'),
      baths: getNumber('baths'),
      propertyType: searchParams.get('propertyType') || undefined,
      sort: (searchParams.get('sort') as FetchListingsParams['sort']) || undefined,
      status: statusArray,
      minSqft: getNumber('minSqft'),
      maxSqft: getNumber('maxSqft'),
      minYearBuilt: getNumber('minYearBuilt'),
      maxYearBuilt: getNumber('maxYearBuilt'),
      maxDaysOnMarket: getNumber('maxDaysOnMarket'),
      keywords: searchParams.get('keywords') || undefined,
    };
  }, [searchParams]);

  const hasFilters = useMemo(() => hasAnyNonPagingFilterFrontend(parsedParams), [
    hasAnyNonPagingFilterFrontend,
    parsedParams,
  ]);

  const effectiveParams = useMemo(() => {
    if (mapBounds) {
      const bbox = mapBounds.bbox;
      const shouldResetPage =
        (!!parsedParams.page && parsedParams.page > 1 && !parsedParams.bbox) ||
        (!!parsedParams.bbox && parsedParams.bbox !== bbox);
      return {
        ...parsedParams,
        limit: parsedParams.limit ?? PAGE_SIZE,
        bbox,
        swLat: mapBounds.swLat,
        swLng: mapBounds.swLng,
        neLat: mapBounds.neLat,
        neLng: mapBounds.neLng,
        ...(shouldResetPage ? { page: 1 } : {}),
      };
    }

    if (parsedParams.bbox) return { ...parsedParams, limit: parsedParams.limit ?? PAGE_SIZE };
    if (hasFilters) return parsedParams;

    // Fallback: if bounds wait timed out, allow bbox-less fetch once
    if (boundsWaitTimedOut) {
      return { ...parsedParams, page: 1 };
    }

    return null;
  }, [mapBounds, parsedParams, hasFilters, boundsWaitTimedOut]);

  const paramsKey = useMemo(() => (effectiveParams ? JSON.stringify(effectiveParams) : null), [
    effectiveParams,
  ]);
  const isWaitingForBounds =
    !useMapbox && effectiveParams === null && !boundsWaitTimedOut;
  const baseQueryKey = useMemo(() => {
    if (!effectiveParams) return null;
    const { page: _page, ...rest } = effectiveParams as any;
    return JSON.stringify({ ...rest, page: 1 });
  }, [effectiveParams]);
  const queryKey = baseQueryKey ?? paramsKey ?? 'none';

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const prevParamsKey = lastParamsKeyRef.current;
    const prevBaseKey = lastBaseQueryKeyRef.current;

    if (
      paramsKey &&
      baseQueryKey &&
      prevParamsKey &&
      prevBaseKey &&
      !baseQueryInvariantWarnedRef.current
    ) {
      try {
        const prevParams: FetchListingsParams = JSON.parse(prevParamsKey);
        const currentParams: FetchListingsParams = JSON.parse(paramsKey);
        const { page: prevPage, ...prevRest } = prevParams;
        const { page: currentPage, ...currentRest } = currentParams;
        const restChanged = JSON.stringify(prevRest) !== JSON.stringify(currentRest);
        const pageChanged = prevPage !== currentPage;
        if (pageChanged && !restChanged && baseQueryKey !== prevBaseKey) {
          console.warn(
            '[SearchLayoutClient] baseQueryKey changed unexpectedly when only page changed',
          );
          baseQueryInvariantWarnedRef.current = true;
        }
      } catch {
        // ignore JSON parse failures in dev-only invariant guard
      }
    }

    lastParamsKeyRef.current = paramsKey;
    lastBaseQueryKeyRef.current = baseQueryKey;
  }, [paramsKey, baseQueryKey]);

  useEffect(() => {
    pinHydrationRunIdRef.current += 1;
    if (pinHydrationControllerRef.current) {
      pinHydrationControllerRef.current.abort();
      pinHydrationControllerRef.current = null;
    }
    clampWarnedBaseKeyRef.current = null;
    lastPinHydrationBaseKeyRef.current = null;
    pinHydrationCapRef.current = PIN_HYDRATION_HARD_CAP;
    const seededMap = buildPinListingsMap(listingsRef.current);
    pinListingsByIdRef.current = seededMap;
    setPinListingsById(seededMap);
    setPinHydrationMeta({
      cap: PIN_HYDRATION_HARD_CAP,
      seeded: seededMap.size,
      hydrated: 0,
      aborted: 0,
      errors: 0,
    });
    setPinHydrationStatus('idle');
  }, [baseQueryKey]);

  useEffect(() => {
    if (!baseQueryKey) return;
    const nextMap = new Map(pinListingsByIdRef.current);
    let added = 0;
    for (const listing of listings) {
      const listingId = listing.id ?? listing.mlsId;
      const key = listingId != null ? listingId.toString() : null;
      if (!key || nextMap.has(key)) continue;
      nextMap.set(key, listing);
      added += 1;
    }
    if (added === 0) return;
    pinListingsByIdRef.current = nextMap;
    setPinListingsById(nextMap);
    setPinHydrationMeta((prev) =>
      prev.seeded === nextMap.size ? prev : { ...prev, seeded: nextMap.size },
    );
  }, [listings, baseQueryKey]);

  useEffect(() => {
    inFlightPagesRef.current.clear();
    loadedPagesRef.current.clear();
    autofillKeyRef.current = null;
    autofillRunningRef.current = false;
    if (!paramsKey) return;
    if (paramsKey === lastFetchedParamsKeyRef.current) return;
    // reset load-more state when base params change
    if (loadMoreControllerRef.current) {
      loadMoreControllerRef.current.abort();
      loadMoreControllerRef.current = null;
    }
    if (autoFillControllerRef.current) {
      autoFillControllerRef.current.abort();
      autoFillControllerRef.current = null;
    }
    setIsLoadingMore(false);
    setIsAutoFilling(false);
    setLoadMoreError(null);
    baseQueryKeyRef.current = baseQueryKey;

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const parsed: FetchListingsParams = JSON.parse(paramsKey);
    const pageKey = `${queryKey}|page=${parsed.page ?? 1}`;
    if (inFlightPagesRef.current.has(pageKey) || loadedPagesRef.current.has(pageKey)) {
      return;
    }
    inFlightPagesRef.current.add(pageKey);
    const controller = new AbortController();
    const fetchRequestId = ++fetchRequestIdRef.current;

    fetchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { results, pagination: newPagination } = await fetchListings(
          parsed,
          controller.signal,
        );
        if (controller.signal.aborted || fetchRequestId !== fetchRequestIdRef.current) return;
        loadedPagesRef.current.add(pageKey);
        setListings(results);
        setPagination(newPagination);
        setError(null);
        lastFetchedParamsKeyRef.current = paramsKey;
      } catch (err) {
        if (controller.signal.aborted || fetchRequestId !== fetchRequestIdRef.current) return;
        console.error('[SearchLayoutClient] failed to fetch listings', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      } finally {
        if (fetchRequestId === fetchRequestIdRef.current) {
          setIsLoading(false);
          hasCompletedInitialFetch.current = true;
        }
        inFlightPagesRef.current.delete(pageKey);
      }
    }, 400);

    return () => {
      controller.abort();
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [paramsKey, baseQueryKey, queryKey]);

  // Auto-fill up to TARGET_RESULTS when bbox is active
  useEffect(() => {
    const shouldAutoFill =
      effectiveParams?.bbox &&
      pagination &&
      listings.length < TARGET_RESULTS &&
      pagination.hasMore &&
      !isLoading &&
      !isLoadingMore &&
      !isAutoFilling;

    if (!shouldAutoFill) return;
    const autoKey = `${queryKey}|autofill`;
    if (autofillRunningRef.current && autofillKeyRef.current === autoKey) return;
    if (autofillKeyRef.current === autoKey) return;

    if (autoFillControllerRef.current) {
      autoFillControllerRef.current.abort();
    }

    const controller = new AbortController();
    autoFillControllerRef.current = controller;
    setIsAutoFilling(true);
    autofillKeyRef.current = autoKey;
    autofillRunningRef.current = true;
    const autofillRequestId = ++autofillRequestIdRef.current;

    const baseKey = baseQueryKeyRef.current;
    let currentPage = pagination.page ?? 1;
    let hasMore = pagination.hasMore;
    let merged = [...listings];
    let finalPagination = pagination;

    const run = async () => {
      try {
        while (
          !controller.signal.aborted &&
          merged.length < TARGET_RESULTS &&
          hasMore
        ) {
          const nextPage = currentPage + 1;
          const pageKey = `${queryKey}|page=${nextPage}`;
          if (inFlightPagesRef.current.has(pageKey) || loadedPagesRef.current.has(pageKey)) {
            hasMore = false;
            break;
          }
          inFlightPagesRef.current.add(pageKey);
          const params = {
            ...effectiveParams,
            page: nextPage,
            limit: effectiveParams.limit ?? PAGE_SIZE,
          };
          try {
            const { results: moreResults, pagination: nextPagination } = await fetchListings(
              params,
              controller.signal,
            );
            if (controller.signal.aborted || autofillRequestId !== autofillRequestIdRef.current) {
              return;
            }
            if (baseKey && baseQueryKeyRef.current && baseQueryKeyRef.current !== baseKey) {
              return;
            }

            const existingIds = new Set(
              merged.map((l) => (l.mlsId ?? l.id ?? '').toString()).filter(Boolean),
            );
            moreResults.forEach((l) => {
              const key = (l.mlsId ?? l.id ?? '').toString();
              if (key && !existingIds.has(key)) {
                existingIds.add(key);
                merged.push(l);
              }
            });

            finalPagination = nextPagination;
            loadedPagesRef.current.add(pageKey);
            currentPage = nextPagination.page ?? nextPage;
            hasMore = nextPagination.hasMore;
            if (controller.signal.aborted || autofillRequestId !== autofillRequestIdRef.current) {
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 120));
          } finally {
            inFlightPagesRef.current.delete(pageKey);
          }
        }
        if (controller.signal.aborted) return;
        if (autofillRequestId !== autofillRequestIdRef.current) return;
        if (baseKey && baseQueryKeyRef.current && baseQueryKeyRef.current !== baseKey) {
          return;
        }
        // Apply batched updates once after autofill completes.
        setListings(merged);
        setPagination(finalPagination);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.warn('[SearchLayoutClient] auto-fill failed', err);
      } finally {
        if (autoFillControllerRef.current === controller) {
          setIsAutoFilling(false);
          autoFillControllerRef.current = null;
          autofillRunningRef.current = false;
        }
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [
    effectiveParams,
    pagination,
    listings,
    isLoading,
    isLoadingMore,
    isAutoFilling,
    queryKey,
  ]);

  useEffect(() => {
    if (!ENABLE_PIN_HYDRATION) return;
    if (!baseQueryKey || !effectiveParams) return;
    const hasAppliedBounds =
      (typeof effectiveParams.bbox === 'string' && effectiveParams.bbox.trim().length > 0) ||
      ([effectiveParams.swLat, effectiveParams.swLng, effectiveParams.neLat, effectiveParams.neLng] as Array<
        number | string | undefined
      >).every((v) => Number.isFinite(typeof v === 'string' ? Number(v) : v));
    if (!hasAppliedBounds) return;
    if (lastPinHydrationBaseKeyRef.current === baseQueryKey) return;

    lastPinHydrationBaseKeyRef.current = baseQueryKey;

    const runId = ++pinHydrationRunIdRef.current;
    if (pinHydrationControllerRef.current) {
      pinHydrationControllerRef.current.abort();
    }
    const controller = new AbortController();
    pinHydrationControllerRef.current = controller;

    let cap = pinHydrationCapRef.current ?? PIN_HYDRATION_HARD_CAP;
    let hasMore = true;
    let page = 1;
    let pagesFetched = 0;
    let maxPages = ABSOLUTE_MAX_PIN_PAGES;
    let finished = false;
    setPinHydrationStatus('running');

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const setStatusIfCurrent = (status: PinHydrationStatus) => {
      setPinHydrationStatus((prev) =>
        pinHydrationRunIdRef.current === runId ? status : prev,
      );
    };

    const run = async () => {
      await delay(FIRST_PIN_REQUEST_DELAY);
      while (!controller.signal.aborted && hasMore) {
        if (pinListingsByIdRef.current.size >= cap) {
          finished = true;
          setStatusIfCurrent('capped');
          return;
        }
        if (pagesFetched >= maxPages || page > maxPages) {
          finished = true;
          setStatusIfCurrent('capped');
          return;
        }
        if (isAutoFillingRef.current || isLoadingMoreRef.current) {
          await delay(150);
          continue;
        }

        const params = {
          ...effectiveParams,
          limit: PIN_HYDRATION_PAGE_LIMIT,
          page,
        };

        let results: Listing[] = [];
        let nextPagination: PaginatedListingsResponse['pagination'] | undefined;
        try {
          const response = await fetchListings(params, controller.signal);
          results = response.results;
          nextPagination = response.pagination;
        } catch (err) {
          if (controller.signal.aborted || pinHydrationRunIdRef.current !== runId) return;
          finished = true;
          console.warn('[SearchLayoutClient] pin hydration failed', err);
          setStatusIfCurrent('error');
          setPinHydrationMeta((prev) =>
            pinHydrationRunIdRef.current === runId ? { ...prev, errors: prev.errors + 1 } : prev,
          );
          return;
        }

        if (controller.signal.aborted || pinHydrationRunIdRef.current !== runId) return;
        pagesFetched += 1;

        if (pagesFetched === 1) {
          const effectiveLimit = (nextPagination?.limit ?? results.length) || 0;
          if (effectiveLimit > 0 && effectiveLimit < LOW_LIMIT_THRESHOLD) {
            const clampSafeCap = Math.min(
              PIN_HYDRATION_HARD_CAP,
              effectiveLimit * MAX_PIN_PAGES_PER_APPLY_FAILSAFE,
            );
            cap = clampSafeCap;
            maxPages = Math.min(maxPages, MAX_PIN_PAGES_PER_APPLY_FAILSAFE);
            pinHydrationCapRef.current = clampSafeCap;
            setPinHydrationMeta((prev) => ({ ...prev, cap: clampSafeCap }));
            if (
              process.env.NODE_ENV === 'development' &&
              clampWarnedBaseKeyRef.current !== baseQueryKey
            ) {
              console.warn('[SearchLayoutClient] pin hydration clamp-safe mode enabled');
              clampWarnedBaseKeyRef.current = baseQueryKey;
            }
          }
        }

        let added = 0;
        const nextMap = new Map(pinListingsByIdRef.current);
        for (const listing of results) {
          const listingId = listing.id ?? listing.mlsId;
          const key = listingId != null ? listingId.toString() : null;
          if (!key || nextMap.has(key)) continue;
          nextMap.set(key, listing);
          added += 1;
        }

        if (added > 0) {
          pinListingsByIdRef.current = nextMap;
          setPinListingsById(nextMap);
          setPinHydrationMeta((prev) => ({
            ...prev,
            seeded: nextMap.size,
            hydrated: prev.hydrated + added,
          }));
        }

        if (pinListingsByIdRef.current.size >= cap) {
          finished = true;
          setStatusIfCurrent('capped');
          return;
        }

        hasMore = nextPagination?.hasMore ?? false;
        if (!hasMore) {
          finished = true;
          setStatusIfCurrent('done');
          return;
        }

        page = (nextPagination?.page ?? page) + 1;
        if (page > ABSOLUTE_MAX_PIN_PAGES) {
          finished = true;
          setStatusIfCurrent('capped');
          return;
        }

        await delay(MIN_DELAY_BETWEEN_PIN_REQUESTS);
      }

      if (controller.signal.aborted || pinHydrationRunIdRef.current !== runId) return;
      finished = true;
      setStatusIfCurrent('done');
    };

    run();

    return () => {
      if (pinHydrationControllerRef.current === controller) {
        controller.abort();
        pinHydrationControllerRef.current = null;
      }
      setPinHydrationStatus((prev) =>
        pinHydrationRunIdRef.current === runId && prev === 'running' ? 'aborted' : prev,
      );
      setPinHydrationMeta((prev) =>
        pinHydrationRunIdRef.current === runId && !finished
          ? { ...prev, aborted: prev.aborted + 1 }
          : prev,
      );
    };
  }, [baseQueryKey, effectiveParams]);

  // Bounds wait timeout: trigger fallback fetch if map bounds never arrive
  useEffect(() => {
    if (useMapbox) return;
    if (mapBounds) {
      setBoundsWaitTimedOut(false);
      return;
    }
    if (parsedParams.bbox || hasFilters) return;
    if (boundsWaitTimedOut) return;

    const timeoutId = setTimeout(() => {
      setBoundsWaitTimedOut(true);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapBounds, parsedParams.bbox, hasFilters, boundsWaitTimedOut, useMapbox]);

  const updateUrlWithBounds = useCallback(
    (bbox: string) => {
      const currentBbox = searchParams.get('bbox');
      if (currentBbox === bbox) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('bbox', bbox);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (useMapbox) return;
    if (!mapBounds) return;
    if (mapBounds.bbox) {
      updateUrlWithBounds(mapBounds.bbox);
    }
  }, [mapBounds, updateUrlWithBounds, useMapbox]);

  useEffect(() => {
    setListPage(1);
  }, [baseQueryKey]);

  const leftPaneClass =
    paneDominance === 'left' ? 'md:basis-3/5' : 'md:basis-2/5';
  const rightPaneClass =
    paneDominance === 'right' ? 'md:basis-3/5' : 'md:basis-2/5';
  const mapPaneClass = mapSide === 'left' ? leftPaneClass : rightPaneClass;
  const listPaneClass = mapSide === 'left' ? rightPaneClass : leftPaneClass;
  const visibleListings = useMemo(
    () => listings.slice(0, listPage * CARDS_PER_PAGE),
    [listings, listPage],
  );

  const appliedBbox = useMapbox
    ? mapBounds?.bbox ?? null
    : mapBounds?.bbox ?? parsedParams.bbox ?? null;

  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      if (useMapbox) {
        setDraftBounds(bounds);
        if (
          !didAutoApplyInitialBoundsRef.current &&
          !appliedBbox &&
          bounds.bbox
        ) {
          didAutoApplyInitialBoundsRef.current = true;
          setMapBounds(bounds);
          updateUrlWithBounds(bounds.bbox);
          trackEvent('search_apply', {
            trigger: 'auto',
            bbox: bounds.bbox,
            page_type: 'search',
          });
          setDraftBounds(null);
        }
        return;
      }
      setDraftBounds(null);
      setMapBounds((prev) => {
        if (
          prev &&
          prev.swLat === bounds.swLat &&
          prev.swLng === bounds.swLng &&
          prev.neLat === bounds.neLat &&
          prev.neLng === bounds.neLng
        ) {
          return prev;
        }
        return bounds;
      });
    },
    [useMapbox, appliedBbox, setMapBounds, setDraftBounds, updateUrlWithBounds],
  );

  const showSearchThisArea =
    useMapbox && draftBounds?.bbox && appliedBbox && draftBounds.bbox !== appliedBbox;
  const isApplyDisabled = isLoading || isAutoFilling || isLoadingMore;
  const handleApplyDraftBounds = useCallback(() => {
    if (!useMapbox) return;
    if (!draftBounds) return;
    setMapBounds(draftBounds);
    if (draftBounds.bbox) {
      updateUrlWithBounds(draftBounds.bbox);
      trackEvent('search_apply', {
        trigger: 'manual',
        bbox: draftBounds.bbox,
        page_type: 'search',
      });
    }
    setDraftBounds(null);
  }, [useMapbox, draftBounds, updateUrlWithBounds, setMapBounds, setDraftBounds]);

  const handleCardClick = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setSelectedListing(listing);
    setIsDetailModalOpen(true);
  };

  const handleSelectListing = (id: string | null) => {
    setSelectedListingId(id);
  };

  useEffect(() => {
    if (!selectedListingId) return;

    const idx = listings.findIndex((l) => l.id === selectedListingId);
    if (idx === -1) return;

    const requiredPage = Math.floor(idx / CARDS_PER_PAGE) + 1;
    if (requiredPage > listPage) {
      setListPage(requiredPage);
    }
    // Do not scroll here; ListingsList handles scroll-to-selected.
  }, [selectedListingId, listings, listPage]);

  const handleLoadMore = useCallback(async () => {
    if (!effectiveParams) return;
    if (isLoadingMore || isWaitingForBounds || isAutoFilling) return;
    if (!pagination?.hasMore) return;

    const currentPage = pagination?.page ?? 1;
    const nextPage = currentPage + 1;
    const pageKey = `${queryKey}|page=${nextPage}`;
    if (inFlightPagesRef.current.has(pageKey) || loadedPagesRef.current.has(pageKey)) {
      return;
    }

    if (loadMoreControllerRef.current) {
      loadMoreControllerRef.current.abort();
    }
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    inFlightPagesRef.current.add(pageKey);
    const nextParams = { ...effectiveParams, page: nextPage };
    const currentBaseKey = baseQueryKey;

    try {
      const { results: moreResults, pagination: nextPagination } = await fetchListings(
        nextParams,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (currentBaseKey && baseQueryKeyRef.current && baseQueryKeyRef.current !== currentBaseKey) {
        return;
      }

      const existingIds = new Set(
        listings.map((l) => (l.mlsId ?? l.id ?? '').toString()).filter(Boolean),
      );
      const merged = [...listings];
      moreResults.forEach((l) => {
        const key = (l.mlsId ?? l.id ?? '').toString();
        if (key && !existingIds.has(key)) {
          existingIds.add(key);
          merged.push(l);
        }
      });

      setListings(merged);
      setPagination(nextPagination);
      loadedPagesRef.current.add(pageKey);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setLoadMoreError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      if (loadMoreControllerRef.current === controller) {
        setIsLoadingMore(false);
        loadMoreControllerRef.current = null;
      }
      inFlightPagesRef.current.delete(pageKey);
    }
  }, [
    baseQueryKey,
    effectiveParams,
    queryKey,
    isLoadingMore,
    isWaitingForBounds,
    isAutoFilling,
    listings,
    pagination,
  ]);

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => {
      setSelectedListing(null);
    }, 200);
  };

  const handledListingIdRef = useRef<string | null>(null);

  useEffect(() => {
    const listingId = searchParams.get('listingId');
    if (!listingId) return;
    if (handledListingIdRef.current === listingId) return;

    const fetchAndOpen = async () => {
      try {
        const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}`);
        if (!res.ok) throw new Error('Failed to fetch listing');
        const data = await res.json().catch(() => null);
        const listing = data?.listing || data;
        if (listing && listing.id) {
          handleCardClick(listing);
          handledListingIdRef.current = listingId;
        }
      } catch (err) {
        console.warn('[SearchLayoutClient] failed to open listingId from URL', err);
        handledListingIdRef.current = listingId;
      }
    };

    fetchAndOpen();
  }, [searchParams]);

  const ToggleButton = ({
    mode,
    children,
  }: {
    mode: 'list' | 'map';
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        viewMode === mode
          ? 'bg-primary text-primary-foreground'
          : 'bg-surface hover:bg-surface-accent'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      <main className="w-full overflow-x-hidden">
        {/* Mobile Toggle */}
        <div className="border-b border-border p-2 md:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted p-1">
            <ToggleButton mode="list">List</ToggleButton>
            <ToggleButton mode="map">Map</ToggleButton>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full overflow-x-hidden">
          {/* Mobile View */}
          <div className="h-full w-full md:hidden">
            {viewMode === 'map' && (
              <div className="relative h-[420px]">
                {showSearchThisArea && (
                  <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2">
                    <button
                      type="button"
                      onClick={handleApplyDraftBounds}
                      disabled={isApplyDisabled}
                      className="pointer-events-auto rounded-full border border-border bg-white/90 px-4 py-2 text-sm font-semibold text-text-main shadow-lg backdrop-blur hover:bg-white hover:shadow-xl disabled:opacity-60"
                    >
                      Search this area
                    </button>
                  </div>
                )}
                <MapComponent
                  listings={pinListings}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  onSelectListing={handleSelectListing}
                  onBoundsChange={handleBoundsChange}
                />
              </div>
            )}
            {viewMode === 'list' && (
              <div className="h-full overflow-y-auto px-4 pt-4 pb-6">
                <div className="mb-3 text-sm text-text-main/70">
                  {isLoading || isWaitingForBounds
                    ? 'Loading...'
                    : `Showing ${visibleListings.length.toLocaleString()} / ${TARGET_RESULTS} results`}{" "}
                  · Pins: {pinCount.toLocaleString()} {pinHydrationSuffix}
                </div>
                {pinHydrationStatus === 'capped' && (
                  <div className="mb-3 text-xs text-text-main/60">
                    Showing up to {pinHydrationMeta.cap.toLocaleString()} pins for this area. Zoom
                    in or refine filters to see more.
                  </div>
                )}
                <ListingsList
                  listings={visibleListings}
                  isLoading={isLoading}
                  isWaiting={isWaitingForBounds}
                  hasMore={pagination?.hasMore}
                  isLoadingMore={isLoadingMore}
                  loadMoreError={loadMoreError}
                  onLoadMore={handleLoadMore}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  onHoverListing={(id) => setHoveredListingId(id)}
                  onSelectListing={handleSelectListing}
                  onCardClick={handleCardClick}
                />
                {visibleListings.length < listings.length && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setListPage((p) => p + 1)}
                      className="w-full rounded-md bg-surface-muted px-4 py-2 text-sm font-semibold text-text-main hover:bg-surface-accent"
                    >
                      Show next{' '}
                      {Math.min(CARDS_PER_PAGE, listings.length - visibleListings.length)} results
                    </button>
                  </div>
                )}
                <div className="mt-6">
                  <Footer />
                </div>
              </div>
            )}
          </div>

          {/* Desktop View (60/40 Split) */}
          {/* Desktop View (60/40 Split) */}
          <div
            className={`hidden md:flex w-full flex-row gap-4 overflow-hidden ${
              mapSide === 'right' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Map Column */}
            <div className={`relative min-w-0 ${mapPaneClass}`}>
              <div className="sticky top-24 h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-border relative">
                {showSearchThisArea && (
                  <div className="pointer-events-none absolute left-1/2 top-4 z-20 flex -translate-x-1/2">
                    <button
                      type="button"
                      onClick={handleApplyDraftBounds}
                      disabled={isApplyDisabled}
                      className="pointer-events-auto rounded-full border border-border bg-white/90 px-4 py-2 text-sm font-semibold text-text-main shadow-lg backdrop-blur hover:bg-white hover:shadow-xl disabled:opacity-60"
                    >
                      Search this area
                    </button>
                  </div>
                )}
                <MapComponent
                  listings={pinListings}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  onSelectListing={handleSelectListing}
                  onBoundsChange={handleBoundsChange}
                />
              </div>
            </div>

            {/* Listings Column */}
            <div className={`h-[calc(100vh-120px)] overflow-y-auto min-w-0 ${listPaneClass}`}>
              <div className="flex h-full flex-col rounded-lg border border-border bg-surface">
                <div className="flex items-end justify-between border-b border-border px-4 pt-3 pb-2">
                  <div>
                    <h2 className="text-xl font-bold text-text-main">
                      Homes for sale
                    </h2>
                    <p className="text-sm text-text-main/70">
                      {isLoading || isWaitingForBounds
                        ? 'Loading...'
                        : `Showing ${visibleListings.length.toLocaleString()} / ${TARGET_RESULTS} results`}
                      {isAutoFilling ? ' (loading...)' : ''}
                    </p>
                    <p className="text-xs text-text-main/60">
                      Pins: {pinCount.toLocaleString()} {pinHydrationSuffix}
                    </p>
                    {pinHydrationStatus === 'capped' && (
                      <p className="text-xs text-text-main/60">
                        Showing up to {pinHydrationMeta.cap.toLocaleString()} pins for this area.
                        Zoom in or refine filters to see more.
                      </p>
                    )}
                    {error && (
                      <p className="text-xs text-red-500">
                        Unable to refresh listings. Please try again.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <ListingsList
                    listings={visibleListings}
                    isLoading={isLoading}
                    isWaiting={isWaitingForBounds}
                    hasMore={pagination?.hasMore}
                    isLoadingMore={isLoadingMore}
                    loadMoreError={loadMoreError}
                    onLoadMore={handleLoadMore}
                    selectedListingId={selectedListingId}
                    hoveredListingId={hoveredListingId}
                    onHoverListing={(id) => setHoveredListingId(id)}
                    onSelectListing={handleSelectListing}
                    onCardClick={handleCardClick}
                  />
                  {visibleListings.length < listings.length && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setListPage((p) => p + 1)}
                        className="w-full rounded-md bg-surface-muted px-4 py-2 text-sm font-semibold text-text-main hover:bg-surface-accent"
                      >
                        Show next{' '}
                        {Math.min(CARDS_PER_PAGE, listings.length - visibleListings.length)} results
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-6">
                  <Footer />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ListingDetailModal
        listing={selectedListing}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
