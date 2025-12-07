import type { Listing as CardListing } from "@/lib/mappers";

interface ListingDetailModalProps {
  listing: CardListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ListingDetailModal({
  listing,
  isOpen,
  onClose,
}: ListingDetailModalProps) {
  if (!isOpen || !listing) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white hover:bg-black/80"
        >
          ✕
        </button>

        {listing.photoUrl && (
          <div className="h-64 w-full bg-black">
            <img
              src={listing.photoUrl}
              alt={listing.addressLine1}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ${listing.price.toLocaleString()}
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {listing.status.replace("_", " ")}
            </span>
          </div>

          <div className="mb-4 text-sm text-slate-700 dark:text-slate-200">
            <div className="font-medium">{listing.addressLine1}</div>
            <div className="text-slate-500 dark:text-slate-400">
              {listing.city}, {listing.state} {listing.zip}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {listing.beds}
              </strong>{" "}
              Beds
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {listing.baths}
              </strong>{" "}
              Baths
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {listing.sqft.toLocaleString()}
              </strong>{" "}
              Sq Ft
            </span>
          </div>

          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Property Type</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                {listing.propertyType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Days on Market</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                {listing.daysOnMarket}
              </span>
            </div>
            {listing.neighborhood && (
              <div className="flex justify-between">
                <span className="text-slate-500">Neighborhood</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {listing.neighborhood}
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            This is a demo listing detail view. Additional property remarks,
            features, and tour scheduling will be wired in future phases.
          </div>
        </div>
      </div>
    </div>
  );
}
