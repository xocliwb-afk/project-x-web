import type { Listing } from "@/lib/mappers";

interface ListingDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ListingDetailModal({ listing, isOpen, onClose }: ListingDetailModalProps) {
  if (!isOpen || !listing) return null;

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/40"
        >
          ✕
        </button>

        {/* Hero Image */}
        <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800">
          <img 
            src={listing.photoUrl} 
            alt={listing.addressLine1} 
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {currency.format(listing.price)}
              </h2>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-200">
                {listing.addressLine1}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {listing.city}, {listing.state} {listing.zip}
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {listing.status.replace("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 py-4 dark:divide-slate-800 dark:border-slate-800">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 dark:text-white">{listing.beds}</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Beds</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 dark:text-white">{listing.baths}</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Baths</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 dark:text-white">{listing.sqft.toLocaleString()}</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Sqft</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Property Type</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">{listing.propertyType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Days on Market</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">{listing.daysOnMarket}</span>
            </div>
             {listing.neighborhood && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Neighborhood</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{listing.neighborhood}</span>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600">
              Request a Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}