import type { Listing } from "../data/listings";

interface ListingDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function ListingDetailModal({
  listing,
  isOpen,
  onClose,
}: ListingDetailModalProps) {
  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-[500px] max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button 
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white leading-none" 
          onClick={onClose} 
          aria-label="Close"
        >
          &times;
        </button>

        <img
          src={listing.photoUrl}
          alt={listing.addressLine1}
          className="w-full aspect-video object-cover rounded-lg mb-5 bg-slate-200"
        />

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-brand-copper mb-1">{currency.format(listing.price)}</h2>
              <p className="text-lg font-medium">
                {listing.addressLine1}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {listing.city}, {listing.state} {listing.zip}
              </p>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                listing.status === "FOR_SALE"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {listing.status.replace("_", " ")}
            </span>
          </div>

          <div className="flex gap-4 py-4 text-sm border-y border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold text-lg">{listing.beds}</span>
              <span className="uppercase text-[10px] text-slate-500 tracking-wider">Beds</span>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold text-lg">{listing.baths}</span>
              <span className="uppercase text-[10px] text-slate-500 tracking-wider">Baths</span>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="font-bold text-lg">
                {listing.sqft.toLocaleString()}
              </span>
              <span className="uppercase text-[10px] text-slate-500 tracking-wider">Sqft</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Property Type</span>
              <span className="font-medium">
                {listing.propertyType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Days on Market</span>
              <span className="font-medium">
                {listing.daysOnMarket}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Neighborhood</span>
              <span className="font-medium">
                {listing.neighborhood || listing.region}
              </span>
            </div>
          </div>

          <button className="w-full mt-2 bg-brand-copper hover:bg-[color:var(--accent-copper-hover)] text-white font-bold py-3 px-4 rounded-lg transition-colors">
            Request a Tour
          </button>
        </div>
      </div>
    </div>
  );
}