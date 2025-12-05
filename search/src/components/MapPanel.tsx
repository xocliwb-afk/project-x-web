import type { Listing } from '../types'

export interface MapPanelProps {
  listings: Listing[]
}

export default function MapPanel({ listings }: MapPanelProps) {
  return (
    <div className="map-pane">
      <div className="placeholder-text">
        Map placeholder – will show markers for {listings.length}{' '}
        {listings.length === 1 ? 'home' : 'homes'}
      </div>
    </div>
  )
}
