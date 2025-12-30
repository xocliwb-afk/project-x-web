'use client';

import type { Listing } from '@project-x/shared-types';
import { useEffect, useRef } from 'react';
import { ListingCard } from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';

type ListingsListProps = {
  listings: Listing[];
  isLoading: boolean;
  selectedListingId: string | null;
  hoveredListingId?: string | null;
  onSelectListing: (id: string | null) => void;
  onHoverListing?: (id: string | null) => void;
  onCardClick?: (listing: Listing) => void;
};

export default function ListingsList({
  listings,
  isLoading,
  selectedListingId,
  hoveredListingId,
  onSelectListing,
  onHoverListing,
  onCardClick,
}: ListingsListProps) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedListingId) return;
    const el = itemRefs.current[selectedListingId];
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedListingId]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <ListingCardSkeleton key={`listing-skeleton-${idx}`} />
        ))}
      </div>
    );
  }

  if (!listings.length) {
    return <p className="text-sm text-slate-500">No listings found.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
      {listings.map((listing) => (
        <div
          key={listing.id}
          data-listing-id={listing.id}
          ref={(el) => {
            if (el) {
              itemRefs.current[listing.id] = el;
            } else {
              delete itemRefs.current[listing.id];
            }
          }}
          className="w-full"
        >
          <ListingCard
            listing={listing}
            isSelected={
              selectedListingId === listing.id ||
              hoveredListingId === listing.id
            }
            onMouseEnter={() => onHoverListing?.(listing.id)}
            onMouseLeave={() => onHoverListing?.(null)}
            onClick={(item) => {
              onSelectListing(listing.id);
              onCardClick?.(item);
            }}
          />
        </div>
      ))}
    </div>
  );
}
