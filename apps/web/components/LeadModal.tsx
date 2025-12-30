"use client";

import type { Listing } from "@/lib/mappers";
import LeadForm from "./LeadForm";

interface LeadModalProps {
  listing: Listing;
  onClose: () => void;
}

export function LeadModal({ listing, onClose }: LeadModalProps) {
  if (!listing) return null;

  const address = `${listing.addressLine1}, ${listing.city}, ${listing.state} ${listing.zip}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-4 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white hover:bg-black/70"
        >
          ✕
        </button>
        <LeadForm
          listingId={listing.id}
          listingAddress={address}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
