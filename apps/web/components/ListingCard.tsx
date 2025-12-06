import type { Listing } from "@/lib/mappers";

interface ListingCardProps {
  listing: Listing;
  onSelect: () => void;
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  const {
    addressLine1,
    city,
    state,
    zip,
    price,
    beds,
    baths,
    sqft,
    photoUrl,
    status,
    daysOnMarket,
    neighborhood,
  } = listing;

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const statusColors: Record<string, string> = {
    FOR_SALE: "bg-emerald-500",
    PENDING: "bg-amber-500",
    SOLD: "bg-slate-500",
  };

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img
          src={photoUrl}
          alt={addressLine1}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute left-3 top-3">
          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider ${statusColors[status] || "bg-slate-500"}`}>
            {status.replace("_", " ")}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
           <span className="inline-block rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {daysOnMarket}d on mkt
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          {currency.format(price)}
        </div>
        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">
          {addressLine1}
        </div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
          {city}, {state} {zip}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-900 dark:text-slate-200">{beds}</span> bds
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-900 dark:text-slate-200">{baths}</span> ba
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-900 dark:text-slate-200">{sqft.toLocaleString()}</span> sqft
          </span>
        </div>

        {neighborhood && (
          <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
            {neighborhood}
          </div>
        )}
      </div>
    </div>
  );
}