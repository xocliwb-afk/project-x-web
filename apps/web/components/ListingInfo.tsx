import type { ListingDetail } from "../types";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ListingInfo({ listing }: { listing: ListingDetail }) {
  return (
    <section className="space-y-4">
      <div>
        <div className="text-3xl font-bold text-text-main">{currency.format(listing.price)}</div>
        <div className="text-lg font-medium text-text-main">{listing.addressLine1}</div>
        <div className="text-sm text-text-muted">{listing.city}, {listing.state} {listing.zip}</div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-text-main">
        <span><strong>{listing.beds}</strong> bd</span>
        <span><strong>{listing.baths}</strong> ba</span>
        <span><strong>{listing.sqft.toLocaleString()}</strong> sqft</span>
        <span>Built <strong>{listing.yearBuilt}</strong></span>
        <span>Lot <strong>{listing.lotSize}</strong> ac</span>
      </div>
      <div className="border-t border-border pt-4 text-sm leading-relaxed text-text-main">{listing.description}</div>
    </section>
  );
}