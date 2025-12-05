import PropertyCard from './PropertyCard'
import type { Listing } from '../types'

export interface ResultsPanelProps {
  listings: Listing[]
}

export default function ResultsPanel({ listings }: ResultsPanelProps) {
  return (
    <div className="results-pane">
      <div className="results-summary">
        {listings.length} {listings.length === 1 ? 'home' : 'homes'} found
      </div>
      <div className="listings-scroll" role="list">
        {listings.length === 0 ? (
          <div className="empty-state">
            No listings match your filters. Try expanding your search.
          </div>
        ) : (
          listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  )
}
