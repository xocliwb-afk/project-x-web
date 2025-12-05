export interface Listing {
  id: string
  address: string
  city: string
  price: number
  beds: number
  baths: number
  sqft: number
  thumbnailUrl: string
  tagline: string
}

export interface SearchFilters {
  location: string
  minPrice?: number
  maxPrice?: number
  beds?: number
  baths?: number
}
