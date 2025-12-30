'use client';

import { useEffect } from 'react';
import type { Listing } from '@project-x/shared-types';
import ListingImageGallery from './ListingImageGallery';
import { ListingInfo } from './ListingInfo';
import Link from 'next/link';

type ListingDetailModalProps = {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ListingDetailModal({
  listing,
  isOpen,
  onClose,
}: ListingDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !listing) {
    return null;
  }

  const handleBackdropClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={handleContentClick}
      >
        <div className="w-full md:w-1/2">
          <ListingImageGallery photos={listing.media?.photos ?? []} />
        </div>
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 md:px-6">
            <Link
              href={`/listing/${listing.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
            >
              View full page
            </Link>
          </div>
          <ListingInfo listing={listing} />
        </div>
      </div>
    </div>
  );
}
