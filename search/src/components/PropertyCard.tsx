import type { Listing } from '../types'

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export interface PropertyCardProps {
  listing: Listing
}

export default function PropertyCard({ listing }: PropertyCardProps) {
  return (
    <article className="listing-card" role="listitem">
      <img
        src={listing.thumbnailUrl}
        alt={`Thumbnail for ${listing.address}`}
        className="listing-thumb"
        loading="lazy"
      />
      <div className="listing-details">
        <div className="listing-price">
          {priceFormatter.format(listing.price)}
        </div>
        <div className="listing-address">{listing.address}</div>
        <div className="listing-city">{listing.city}</div>
        <div className="listing-meta">
          <span>{listing.beds} bd</span>
          <span>{listing.baths} ba</span>
          <span>{listing.sqft.toLocaleString()} sqft</span>
        </div>
        <p className="listing-tagline">{listing.tagline}</p>
      </div>
    </article>
  )
}
