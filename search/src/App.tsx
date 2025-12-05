import { useMemo, useState } from 'react'
import LayoutShell from './components/LayoutShell'
import FiltersBar from './components/FiltersBar'
import MapPanel from './components/MapPanel'
import ResultsPanel from './components/ResultsPanel'
import { Listing, SearchFilters } from './types'
import './App.css'

const LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    address: '123 River Oaks Drive',
    city: 'Grand Rapids, MI',
    price: 425000,
    beds: 4,
    baths: 3,
    sqft: 2450,
    thumbnailUrl: 'https://placehold.co/120x90?text=Home+1',
    tagline: 'Tree-lined lot with airy living spaces.',
  },
  {
    id: 'listing-2',
    address: '8846 Lakeshore Court',
    city: 'Holland, MI',
    price: 675000,
    beds: 5,
    baths: 4,
    sqft: 3325,
    thumbnailUrl: 'https://placehold.co/120x90?text=Home+2',
    tagline: 'Lake access plus a chef-inspired kitchen.',
  },
  {
    id: 'listing-3',
    address: '57 Oak Hollow Lane',
    city: 'Ada, MI',
    price: 539000,
    beds: 4,
    baths: 3,
    sqft: 2890,
    thumbnailUrl: 'https://placehold.co/120x90?text=Home+3',
    tagline: 'Modern farmhouse with vaulted great room.',
  },
  {
    id: 'listing-4',
    address: '210 Market Street SE #1203',
    city: 'Grand Rapids, MI',
    price: 315000,
    beds: 2,
    baths: 2,
    sqft: 1380,
    thumbnailUrl: 'https://placehold.co/120x90?text=Loft',
    tagline: 'Downtown loft with skyline views.',
  },
  {
    id: 'listing-5',
    address: '88 Sand Dune Trail',
    city: 'Grand Haven, MI',
    price: 799000,
    beds: 5,
    baths: 4,
    sqft: 3685,
    thumbnailUrl: 'https://placehold.co/120x90?text=Home+5',
    tagline: 'Steps from the shoreline with outdoor lounge.',
  },
  {
    id: 'listing-6',
    address: '412 Meadow Ridge',
    city: 'Rockford, MI',
    price: 459000,
    beds: 4,
    baths: 3,
    sqft: 2610,
    thumbnailUrl: 'https://placehold.co/120x90?text=Home+6',
    tagline: 'Quiet cul-de-sac with walkout basement.',
  },
  {
    id: 'listing-7',
    address: '1420 Cherry Street SE',
    city: 'East Grand Rapids, MI',
    price: 948000,
    beds: 6,
    baths: 5,
    sqft: 4120,
    thumbnailUrl: 'https://placehold.co/120x90?text=Home+7',
    tagline: 'Historic charm updated for modern living.',
  },
]

function App() {
  const [filters, setFilters] = useState<SearchFilters>({ location: '' })

  const filteredListings = useMemo(() => {
    const query = filters.location.trim().toLowerCase()

    return LISTINGS.filter((listing) => {
      if (
        query &&
        !`${listing.city} ${listing.address}`.toLowerCase().includes(query)
      ) {
        return false
      }

      if (typeof filters.minPrice === 'number' && listing.price < filters.minPrice) {
        return false
      }

      if (typeof filters.maxPrice === 'number' && listing.price > filters.maxPrice) {
        return false
      }

      if (typeof filters.beds === 'number' && listing.beds < filters.beds) {
        return false
      }

      if (typeof filters.baths === 'number' && listing.baths < filters.baths) {
        return false
      }

      return true
    })
  }, [filters])

  const handleFiltersChange = (next: SearchFilters) => {
    setFilters(next)
  }

  const handleSearch = () => {
    console.log('Search', filters)
  }

  return (
    <LayoutShell>
      <FiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        onSearch={handleSearch}
      />
      <section className="content-split">
        <MapPanel listings={filteredListings} />
        <ResultsPanel listings={filteredListings} />
      </section>
    </LayoutShell>
  )
}

export default App
