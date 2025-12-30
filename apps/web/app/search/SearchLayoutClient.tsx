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
import Footer from '@/components/Footer';
import ListingsList from '@/components/ListingsList';
import { ListingDetailModal } from '@/components/ListingDetailModal';
import { useTheme } from '@/context/ThemeContext';

const MapPanel = dynamic(() => import('@/components/Map'), {
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

export default function SearchLayoutClient({
  initialListings,
  initialPagination,
}: SearchLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mapSide, paneDominance } = useTheme();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [pagination, setPagination] =
    useState<PaginatedListingsResponse['pagination']>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedInitialFetch = useRef(false);

  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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

  const effectiveParams = useMemo(() => {
    if (!mapBounds) return parsedParams;
    return {
      ...parsedParams,
      bbox: mapBounds.bbox,
      swLat: mapBounds.swLat,
      swLng: mapBounds.swLng,
      neLat: mapBounds.neLat,
      neLng: mapBounds.neLng,
    };
  }, [mapBounds, parsedParams]);

  const paramsKey = useMemo(
    () => JSON.stringify(effectiveParams),
    [effectiveParams],
  );

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const parsed: FetchListingsParams = JSON.parse(paramsKey);
    const controller = new AbortController();

    fetchTimeoutRef.current = setTimeout(async () => {
      if (hasCompletedInitialFetch.current) {
        setIsLoading(true);
      }
      try {
        const { results, pagination: newPagination } = await fetchListings(
          parsed,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setListings(results);
        setPagination(newPagination);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('[SearchLayoutClient] failed to fetch listings', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          hasCompletedInitialFetch.current = true;
        }
      }
    }, 400);

    return () => {
      controller.abort();
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [paramsKey]);

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
    if (!mapBounds) return;
    if (mapBounds.bbox) {
      updateUrlWithBounds(mapBounds.bbox);
    }
  }, [mapBounds, updateUrlWithBounds]);

  const leftPaneClass =
    paneDominance === 'left' ? 'md:basis-3/5' : 'md:basis-2/5';
  const rightPaneClass =
    paneDominance === 'right' ? 'md:basis-3/5' : 'md:basis-2/5';
  const mapPaneClass = mapSide === 'left' ? leftPaneClass : rightPaneClass;
  const listPaneClass = mapSide === 'left' ? rightPaneClass : leftPaneClass;

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
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
  }, []);

  const handleCardClick = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setSelectedListing(listing);
    setIsDetailModalOpen(true);
  };

  const handleSelectListing = (id: string | null) => {
    setSelectedListingId(id);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => {
      setSelectedListing(null);
    }, 200);
  };

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
              <div className="h-[420px]">
                <MapPanel
                  listings={listings}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  onSelectListing={handleSelectListing}
                  onBoundsChange={handleBoundsChange}
                />
              </div>
            )}
            {viewMode === 'list' && (
              <div className="h-full overflow-y-auto px-4 pt-4 pb-6">
                <ListingsList
                  listings={listings}
                  isLoading={isLoading}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  onHoverListing={(id) => setHoveredListingId(id)}
                  onSelectListing={handleSelectListing}
                  onCardClick={handleCardClick}
                />
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
              <div className="sticky top-24 h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-border">
                <MapPanel
                  listings={listings}
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
                      {isLoading
                        ? 'Loading...'
                        : `${(pagination.pageCount ?? listings.length).toLocaleString()} results`}
                    </p>
                    {error && (
                      <p className="text-xs text-red-500">
                        Unable to refresh listings. Please try again.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <ListingsList
                    listings={listings}
                    isLoading={isLoading}
                    selectedListingId={selectedListingId}
                    hoveredListingId={hoveredListingId}
                    onHoverListing={(id) => setHoveredListingId(id)}
                    onSelectListing={handleSelectListing}
                    onCardClick={handleCardClick}
                  />
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
