'use client';

import { Listing } from '@project-x/shared-types';
import { useLeadModalStore } from '@/stores/useLeadModalStore';

type DetailItemProps = {
  label: string;
  value: string | number | null | undefined;
};

const DetailItem = ({ label, value }: DetailItemProps) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  return (
    <div>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <p className="font-semibold text-slate-800 dark:text-slate-200">
        {String(value)}
      </p>
    </div>
  );
};

type ListingInfoProps = {
  listing: Listing;
};

export function ListingInfo({ listing }: ListingInfoProps) {
  const openLeadModal = useLeadModalStore((s) => s.open);

  const numericPrice =
    typeof listing.listPrice === 'number' ? listing.listPrice : 0;

  const priceText =
    typeof listing.listPriceFormatted === 'string' &&
    listing.listPriceFormatted.trim().length > 0
      ? listing.listPriceFormatted
      : `$${numericPrice.toLocaleString()}`;

  const fullAddress = listing.address?.full ?? 'Address unavailable';
  const cityStateZip = `${listing.address?.city ?? ''}, ${
    listing.address?.state ?? ''
  } ${listing.address?.zip ?? ''}`;

  const { beds, baths, sqft, lotSize, yearBuilt, propertyType, status } =
    listing.details ?? {};
  const description =
    typeof listing.description === 'string' && listing.description.trim().length > 0
      ? listing.description.trim()
      : null;

  return (
    <>
      <div className="p-6 overflow-y-auto flex-grow">
        {status && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {status.replace(/_/g, ' ')}
          </span>
        )}
        <h1 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">
          {priceText}
        </h1>
        <p className="text-md text-slate-600 dark:text-slate-400 mt-1">
          {fullAddress}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          {cityStateZip}
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center border-y border-slate-200 dark:border-slate-700 py-4">
          <div>
            <span className="font-bold text-2xl text-slate-800 dark:text-slate-100">
              {beds ?? '-'}
            </span>
            <p className="text-xs text-slate-500">Beds</p>
          </div>
          <div>
            <span className="font-bold text-2xl text-slate-800 dark:text-slate-100">
              {baths ?? '-'}
            </span>
            <p className="text-xs text-slate-500">Baths</p>
          </div>
          <div>
            <span className="font-bold text-2xl text-slate-800 dark:text-slate-100">
              {typeof sqft === 'number' && sqft > 0
                ? sqft.toLocaleString()
                : '-'}
            </span>
            <p className="text-xs text-slate-500">Sqft</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
            Key Facts
          </h2>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <DetailItem label="Property Type" value={propertyType} />
            <DetailItem label="Year Built" value={yearBuilt} />
            <DetailItem
              label="Lot Size (sqft)"
              value={
                typeof lotSize === 'number' ? lotSize.toLocaleString() : null
              }
            />
          </div>
        </div>

        {description && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line dark:text-slate-300">
              {description}
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <button
          type="button"
          onClick={() =>
            openLeadModal({
              listingId: listing.id,
              listingAddress: listing.address?.full ?? undefined,
            })
          }
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          I&apos;m Interested
        </button>
      </div>
    </>
  );
}
