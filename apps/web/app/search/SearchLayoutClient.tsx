'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Listing } from '@project-x/shared-types';
import type { PaginatedListingsResponse } from '@/lib/api-client';
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

export default function SearchLayoutClient({
  initialListings,
  initialPagination,
}: SearchLayoutClientProps) {
  const { mapSide, paneDominance } = useTheme();
  const [listings] = useState<Listing[]>(initialListings);
  const [pagination] = useState<PaginatedListingsResponse['pagination']>(
    initialPagination,
  );

  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectionTick, setSelectionTick] = useState(0);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const leftPaneClass =
    paneDominance === 'left' ? 'md:basis-3/5' : 'md:basis-2/5';
  const rightPaneClass =
    paneDominance === 'right' ? 'md:basis-3/5' : 'md:basis-2/5';
  const mapPaneClass = mapSide === 'left' ? leftPaneClass : rightPaneClass;
  const listPaneClass = mapSide === 'left' ? rightPaneClass : leftPaneClass;

  const handleCardClick = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setSelectionTick((t) => t + 1);
    setSelectedListing(listing);
    setIsDetailModalOpen(true);
  };

  const handleSelectListing = (id: string | null) => {
    setSelectedListingId(id);
    setSelectionTick((t) => t + 1);
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
      <main className="h-[calc(100vh-64px)] w-full">
        {/* Mobile Toggle */}
        <div className="border-b border-border p-2 md:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted p-1">
            <ToggleButton mode="list">List</ToggleButton>
            <ToggleButton mode="map">Map</ToggleButton>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="h-full w-full">
          {/* Mobile View */}
          <div className="h-full w-full md:hidden">
            {viewMode === 'map' && (
              <MapPanel
                listings={listings}
                selectedListingId={selectedListingId}
                hoveredListingId={hoveredListingId}
                onSelectListing={handleSelectListing}
              />
            )}
            {viewMode === 'list' && (
              <div className="h-full overflow-y-auto px-4 pt-4 pb-6">
                <ListingsList
                  listings={listings}
                  isLoading={false}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  onHoverListing={(id) => setHoveredListingId(id)}
                  onSelectListing={handleSelectListing}
                  selectionTick={selectionTick}
                  onCardClick={handleCardClick}
                />
              </div>
            )}
          </div>

          {/* Desktop View (60/40 Split) */}
          <div className="hidden h-full w-full md:flex md:gap-4 md:p-4">
            {mapSide === 'left' ? (
              <>
                <div
                  className={`h-full w-full overflow-hidden rounded-lg border border-border ${mapPaneClass}`}
                >
                  <MapPanel
                    listings={listings}
                    selectedListingId={selectedListingId}
                    hoveredListingId={hoveredListingId}
                    onSelectListing={handleSelectListing}
                  />
                </div>

                <div
                  className={`flex h-full w-full flex-col rounded-lg border border-border bg-surface ${listPaneClass}`}
                >
                  <div className="flex items-end justify-between border-b border-border px-4 py-3">
                    <div>
                      <h2 className="text-xl font-bold text-text-main">
                        Homes for sale
                      </h2>
                      <p className="text-sm text-text-main/70">
                        {pagination.total} results
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
                    <ListingsList
                      listings={listings}
                      isLoading={false}
                      selectedListingId={selectedListingId}
                      hoveredListingId={hoveredListingId}
                      onHoverListing={(id) => setHoveredListingId(id)}
                      onSelectListing={handleSelectListing}
                      selectionTick={selectionTick}
                      onCardClick={handleCardClick}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`flex h-full w-full flex-col rounded-lg border border-border bg-surface ${listPaneClass}`}
                >
                  <div className="flex items-end justify-between border-b border-border px-4 py-3">
                    <div>
                      <h2 className="text-xl font-bold text-text-main">
                        Homes for sale
                      </h2>
                      <p className="text-sm text-text-main/70">
                        {pagination.total} results
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
                    <ListingsList
                      listings={listings}
                      isLoading={false}
                      selectedListingId={selectedListingId}
                      hoveredListingId={hoveredListingId}
                      onHoverListing={(id) => setHoveredListingId(id)}
                      onSelectListing={handleSelectListing}
                      selectionTick={selectionTick}
                      onCardClick={handleCardClick}
                    />
                  </div>
                </div>

                <div
                  className={`h-full w-full overflow-hidden rounded-lg border border-border ${mapPaneClass}`}
                >
                  <MapPanel
                    listings={listings}
                    selectedListingId={selectedListingId}
                    hoveredListingId={hoveredListingId}
                    onSelectListing={handleSelectListing}
                  />
                </div>
              </>
            )}
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
