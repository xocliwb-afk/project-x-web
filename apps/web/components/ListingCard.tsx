import type { Listing } from "@/lib/mappers";

interface ListingCardProps {
  listing: Listing;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function ListingCard({ listing, onSelect, isSelected }: ListingCardProps) {
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

  return (
    <article
      className={[
        "flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 cursor-pointer",
        "border-slate-200 bg-surface hover:-translate-y-0.5 hover:shadow-lg",
        "dark:border-slate-800 dark:bg-slate-900",
        isSelected ? "ring-2 ring-blue-600" : "",
      ].join(" ")}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={addressLine1}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-800 shadow-sm">
          {status.replace("_", " ")}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">
          ${price.toLocaleString()}
        </div>

        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {beds}
            </span>{" "}
            bds
          </span>
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {baths}
            </span>{" "}
            ba
          </span>
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {sqft.toLocaleString()}
            </span>{" "}
            sqft
          </span>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300">
          <div className="font-medium">{addressLine1}</div>
          <div className="text-slate-500 dark:text-slate-400">
            {city}, {state} {zip}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-slate-400 dark:text-slate-500">
          {neighborhood ? (
            <span className="truncate max-w-[60%]">{neighborhood}</span>
          ) : (
            <span />
          )}
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Days on market {daysOnMarket}
          </span>
        </div>
      </div>
    </article>
  );
}
