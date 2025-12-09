import { notFound } from 'next/navigation';
import { fetchListing } from '@/lib/api-client';
import ContactAgentPanel from '@/components/listing-detail/ContactAgentPanel';

type ListingDetailPageProps = {
  params: {
    id: string;
  };
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  let listingResponse;
  try {
    listingResponse = await fetchListing(params.id);
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.includes('404')) {
      notFound();
    }
    throw error;
  }

  const { listing } = listingResponse;
  const primaryPhoto = listing.media.photos[0] ?? null;

  const brokerId = process.env.NEXT_PUBLIC_BROKER_ID || 'demo-broker';

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          {primaryPhoto ? (
            <img src={primaryPhoto} alt={listing.address.full} className="h-96 w-full object-cover" />
          ) : (
            <div className="flex h-96 w-full items-center justify-center text-white/70">
              No photo available
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6 rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-text-muted">
                {listing.details.propertyType ?? 'Property'}
              </p>
              <h1 className="text-3xl font-bold text-text-main">
                {listing.address.street}, {listing.address.city}, {listing.address.state} {listing.address.zip}
              </h1>
              <p className="mt-2 text-2xl font-semibold text-primary">{currency.format(listing.listPrice)}</p>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm text-text-main sm:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Beds</dt>
                <dd className="text-lg font-semibold">{listing.details.beds ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Baths</dt>
                <dd className="text-lg font-semibold">{listing.details.baths ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Sq Ft</dt>
                <dd className="text-lg font-semibold">
                  {listing.details.sqft ? listing.details.sqft.toLocaleString() : '--'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Status</dt>
                <dd className="text-lg font-semibold">{listing.details.status}</dd>
              </div>
            </dl>

            <div>
              <h2 className="text-lg font-semibold text-text-main">Description</h2>
              <p className="mt-2 text-sm text-text-muted">
                {listing.details.basement
                  ? `Includes ${listing.details.basement.toLowerCase()} basement.`
                  : 'Additional property details coming soon.'}
              </p>
            </div>
          </div>

          <ContactAgentPanel listingId={listing.id} brokerId={brokerId} />
        </div>
      </div>
    </div>
  );
}
