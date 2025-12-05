import { FormEvent, useMemo, useState } from 'react'
import './App.css'

type Listing = {
  id: number
  address: string
  city: string
  price: number
  beds: number
  baths: number
  sqft: number
  thumbnailUrl: string
  tagline: string
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 6,
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
    id: 7,
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

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function App() {
  const [location, setLocation] = useState('')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [beds, setBeds] = useState<number | 'Any'>('Any')
  const [baths, setBaths] = useState<number | 'Any'>('Any')

  const filteredListings = useMemo(() => {
    const query = location.trim().toLowerCase()

    return MOCK_LISTINGS.filter((listing) => {
      if (
        query &&
        !`${listing.city} ${listing.address}`.toLowerCase().includes(query)
      ) {
        return false
      }

      if (minPrice !== '' && listing.price < minPrice) {
        return false
      }

      if (maxPrice !== '' && listing.price > maxPrice) {
        return false
      }

      if (beds !== 'Any' && listing.beds < beds) {
        return false
      }

      if (baths !== 'Any' && listing.baths < baths) {
        return false
      }

      return true
    })
  }, [location, minPrice, maxPrice, beds, baths])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    console.log('Search filters', {
      location,
      minPrice,
      maxPrice,
      beds,
      baths,
    })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-placeholder" aria-hidden="true">
          Logo
        </div>
        <div className="brand-text">
          The Brandon Wilcox Home Group at 616 Realty
        </div>
      </header>

      <main className="app-main">
        <section className="search-controls" aria-label="Search controls">
          <form className="controls-grid" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
            <input
              type="number"
              placeholder="Price min"
              min="0"
              value={minPrice === '' ? '' : String(minPrice)}
              onChange={(event) => {
                const nextValue = event.target.value
                setMinPrice(nextValue === '' ? '' : Number(nextValue))
              }}
            />
            <input
              type="number"
              placeholder="Price max"
              min="0"
              value={maxPrice === '' ? '' : String(maxPrice)}
              onChange={(event) => {
                const nextValue = event.target.value
                setMaxPrice(nextValue === '' ? '' : Number(nextValue))
              }}
            />
            <select
              aria-label="Minimum beds"
              value={beds === 'Any' ? 'Any' : String(beds)}
              onChange={(event) => {
                const nextValue = event.target.value
                setBeds(nextValue === 'Any' ? 'Any' : Number(nextValue))
              }}
            >
              <option value="Any">Beds: Any</option>
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count}+ beds
                </option>
              ))}
            </select>
            <select
              aria-label="Minimum baths"
              value={baths === 'Any' ? 'Any' : String(baths)}
              onChange={(event) => {
                const nextValue = event.target.value
                setBaths(nextValue === 'Any' ? 'Any' : Number(nextValue))
              }}
            >
              <option value="Any">Baths: Any</option>
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}+ baths
                </option>
              ))}
            </select>
            <button type="submit">Search</button>
          </form>
        </section>

        <section className="content-split">
          <div className="map-pane">
            <div className="placeholder-text">
              Map placeholder – will show markers for {filteredListings.length}{' '}
              {filteredListings.length === 1 ? 'home' : 'homes'}
            </div>
          </div>
          <div className="results-pane">
            <div className="results-summary">
              {filteredListings.length}{' '}
              {filteredListings.length === 1 ? 'home' : 'homes'} found
            </div>
            <div className="listings-scroll" role="list">
              {filteredListings.length === 0 ? (
                <div className="empty-state">
                  No listings match your filters. Try expanding your search.
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <article
                    key={listing.id}
                    className="listing-card"
                    role="listitem"
                  >
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
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        © The Brandon Wilcox Home Group – Project X beta
      </footer>
    </div>
  )
}

export default App
