'use client';

import type { Listing } from '@project-x/shared-types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  formatAddressFull,
  formatAttribution,
  formatDaysOnMarketShort,
  formatPrice,
  formatSqft,
  formatStatus,
  getListingDetailsRows,
  getStatusBadgeClasses,
  getThumbnailUrl,
} from '@/lib/listingFormat';

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
  const photos = listing.media?.photos ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const priceText = formatPrice(listing);
  const beds = listing.details?.beds ?? 0;
  const baths = listing.details?.baths ?? 0;
  const sqft = formatSqft(listing.details?.sqft ?? null);
  const daysOnMarket = formatDaysOnMarketShort(listing.meta?.daysOnMarket ?? null);
  const mlsAttribution = formatAttribution();

  const fullAddress = formatAddressFull(listing);
  const thumbnail = getThumbnailUrl(listing);
  const status = listing.details?.status;
  const currentImageUrl = photos[currentIndex] ?? photos[0] ?? thumbnail;
  const statusClass = getStatusBadgeClasses(status);
  const detailRows = getListingDetailsRows(listing);

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
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onMouseEnter(listing.id)}
      onMouseLeave={onMouseLeave}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 cursor-pointer dark:bg-slate-800 ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md hover:-translate-y-1'
      }`}
      aria-label={`View details for ${fullAddress}`}
    >
      <div className="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-700 aspect-[4/3]">
        <Image
          src={currentImageUrl}
          alt={`Image of ${fullAddress}`}
          fill
          style={{ objectFit: 'cover' }}
          className="bg-slate-200"
        />
        {typeof status === 'string' && status.trim().length > 0 && (
          <div className="absolute left-3 top-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${statusClass}`}
            >
              {formatStatus(status)}
            </span>
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 flex -translate-y-1/2 rounded-full bg-white/80 p-1 text-slate-800 shadow opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
              }}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 rounded-full bg-white/80 p-1 text-slate-800 shadow opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentIndex((prev) => (prev + 1) % photos.length);
              }}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white">
                {priceText}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                {fullAddress}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Link
                href={`/listing/${listing.id}`}
                onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                className="whitespace-nowrap text-xs text-blue-500 hover:underline"
                aria-label={`View full page for ${fullAddress}`}
              >
                Full Page
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{beds} bd</span>
            <span>•</span>
            <span>{baths} ba</span>
            {sqft && (
              <>
                <span>•</span>
                <span>{sqft} sqft</span>
              </>
            )}
          </div>

          {detailRows.length > 0 && (
            <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
              {detailRows.map((row) => (
                <div key={row.label} className="flex gap-1">
                  <span className="font-semibold">{row.label}:</span>
                  <span className="line-clamp-1">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
          <span className="line-clamp-1">{mlsAttribution}</span>
          {daysOnMarket && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {daysOnMarket}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
