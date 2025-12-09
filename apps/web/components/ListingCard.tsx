'use client';

import type { Listing } from '@project-x/shared-types';
import Image from 'next/image';
import Link from 'next/link';

interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onClick?: (listing: Listing) => void;
}

export function ListingCard({
  listing,
  isSelected,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ListingCardProps) {
  // --- Derive Null-Safe Values ---
  const numericPrice =
    typeof listing.listPrice === 'number' ? listing.listPrice : 0;

  const priceText =
    typeof listing.listPriceFormatted === 'string' &&
    listing.listPriceFormatted.trim().length > 0
      ? listing.listPriceFormatted
      : `$${numericPrice.toLocaleString()}`;

  const status = listing.details?.status;
  const beds = listing.details?.beds ?? 0;
  const baths = listing.details?.baths ?? 0;
  const sqft = listing.details?.sqft ?? null;
  const daysOnMarket =
    typeof listing.meta?.daysOnMarket === 'number' ? listing.meta.daysOnMarket : null;

  const fullAddress = listing.address?.full ?? 'Address unavailable';
  const mainPhoto =
    listing.media?.photos?.[0] ?? '/placeholder-house.jpg';

  // --- Event Handlers ---
  const handleClick = () => {
    onClick?.(listing);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent space from scrolling the page
      onClick?.(listing);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onMouseEnter(listing.id)}
      onMouseLeave={onMouseLeave}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-xl hover:-translate-y-1'
      }`}
      aria-label={`View details for ${fullAddress}`}
    >
      <div className="relative h-48 w-full">
        <Image
          src={mainPhoto}
          alt={`Image of ${fullAddress}`}
          fill
          style={{ objectFit: 'cover' }}
          className="bg-slate-200"
        />
        {daysOnMarket && daysOnMarket > 0 && (
          <div className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
            {daysOnMarket} DOM
          </div>
        )}
        <div className="absolute top-2 right-2">
          {typeof status === 'string' && status.trim().length > 0 && (
            <span className="rounded-full bg-slate-100/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
              {status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {priceText}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
              {fullAddress}
            </p>
          </div>
          <Link
            href={`/listing/${listing.id}`}
            onClick={(e) => e.stopPropagation()} // Prevent card click from firing
            className="text-xs text-blue-500 hover:underline whitespace-nowrap ml-2"
            aria-label={`View full page for ${fullAddress}`}
          >
            Full Page
          </Link>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-300">
          <span>{beds} bd</span>
          <span className="mx-2">•</span>
          <span>{baths} ba</span>
          {typeof sqft === 'number' && sqft > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>{sqft.toLocaleString()} sqft</span>
            </>
          )}
          {daysOnMarket && daysOnMarket > 0 && (
            <div className="mt-1 text-gray-500 dark:text-slate-400">
              {daysOnMarket} days on market
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
