import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { fetchListing } from '@/lib/api-client';
import BackButton from '@/components/BackButton';
import ListingImageGallery from '@/components/ListingImageGallery';
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

const InlineMap = dynamic(() => import('@/components/Map'), { ssr: false });

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  let listing: Awaited<ReturnType<typeof fetchListing>>;
  try {
    listing = await fetchListing(params.id);
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.includes('404')) {
      notFound();
    }
    throw error;
  }

  const photos = listing.media?.photos ?? [];

  const brokerId = process.env.NEXT_PUBLIC_BROKER_ID || 'demo-broker';
  const beds = listing.details?.beds ?? null;
  const baths = listing.details?.baths ?? null;
  const sqft = listing.details?.sqft ?? null;
  const lotSize = listing.details?.lotSize ?? null;
  const yearBuilt = listing.details?.yearBuilt ?? null;
  const hoa = listing.details?.hoaFees ?? null;
  const basement = listing.details?.basement ?? null;
  const propertyType = listing.details?.propertyType ?? null;
  const status = listing.details?.status ?? null;
  const mlsName = listing.meta?.mlsName ?? null;
  const description =
    (listing as any)?.description ||
    (listing as any)?.remarks ||
    (listing.details as any)?.description ||
    'Property description coming soon.';
  const priceLabel =
    typeof listing.listPriceFormatted === 'string' && listing.listPriceFormatted.trim().length > 0
      ? listing.listPriceFormatted
      : currency.format(listing.listPrice ?? 0);

  const mapListing = {
    ...listing,
    id: listing.id,
  };

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <BackButton />
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
          <ListingImageGallery photos={photos} />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {status && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {status.replace(/_/g, ' ')}
                </span>
              )}
              {listing.meta?.daysOnMarket != null && (
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted">
                  {listing.meta.daysOnMarket} days on market
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-text-main sm:text-4xl">{priceLabel}</h1>
            <p className="text-lg text-text-main/80">
              {listing.address.street}, {listing.address.city}, {listing.address.state} {listing.address.zip}
            </p>
            {mlsName && (
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Listing courtesy of {mlsName}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="order-2 space-y-8 lg:order-1">
            <section className="rounded-2xl border border-border bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-text-main">Key Facts</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-text-main sm:grid-cols-3">
                <Fact label="Beds" value={beds ?? '--'} />
                <Fact label="Baths" value={baths ?? '--'} />
                <Fact label="Square Feet" value={sqft ? sqft.toLocaleString() : '--'} />
                <Fact label="Lot Size" value={lotSize ? `${lotSize} ac` : '--'} />
                <Fact label="Year Built" value={yearBuilt ?? '--'} />
                <Fact label="HOA" value={hoa ? currency.format(hoa) : 'N/A'} />
                <Fact label="Basement" value={basement ?? '—'} />
                <Fact label="Property Type" value={propertyType ?? '—'} />
                <Fact label="Status" value={status ?? '—'} />
              </dl>
            </section>

            <section className="rounded-2xl border border-border bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-text-main">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-muted">{description}</p>
            </section>

            {listing.address?.lat != null && listing.address?.lng != null && (
              <section className="rounded-2xl border border-border bg-white/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-text-main">Map</h2>
                <div className="mt-4 h-72 overflow-hidden rounded-xl border border-border">
                  <InlineMap
                    listings={[mapListing as any]}
                    selectedListingId={listing.id}
                    hoveredListingId={null}
                  />
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-dashed border-border bg-surface-muted/60 p-4 text-xs text-text-muted">
              {mlsName && (
                <p className="font-semibold text-text-main">
                  Listing courtesy of {mlsName}
                </p>
              )}
              <p className="mt-1">
                Information deemed reliable but not guaranteed. Buyers should verify all information with the listing broker.
              </p>
            </section>
          </div>

          <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
            <ContactAgentPanel listingId={listing.id} brokerId={brokerId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-muted/60 p-3">
      <dt className="text-[11px] uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-text-main">{value}</dd>
    </div>
  );
}
