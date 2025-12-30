import type { FormEvent } from 'react'
import type { SearchFilters } from '../types'

export interface FiltersBarProps {
  filters: SearchFilters
  onChange: (next: SearchFilters) => void
  onSearch: () => void
}

export default function FiltersBar({
  filters,
  onChange,
  onSearch,
}: FiltersBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch()
  }

  const updateFilters = (next: Partial<SearchFilters>) => {
    onChange({ ...filters, ...next })
  }

  return (
    <section className="search-controls" aria-label="Search controls">
      <form className="controls-grid" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(event) => updateFilters({ location: event.target.value })}
        />
        <input
          type="number"
          placeholder="Price min"
          min="0"
          value={filters.minPrice ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value
            updateFilters({
              minPrice: nextValue === '' ? undefined : Number(nextValue),
            })
          }}
        />
        <input
          type="number"
          placeholder="Price max"
          min="0"
          value={filters.maxPrice ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value
            updateFilters({
              maxPrice: nextValue === '' ? undefined : Number(nextValue),
            })
          }}
        />
        <select
          aria-label="Minimum beds"
          value={filters.beds?.toString() ?? 'Any'}
          onChange={(event) => {
            const nextValue = event.target.value
            updateFilters({
              beds: nextValue === 'Any' ? undefined : Number(nextValue),
            })
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
          value={filters.baths?.toString() ?? 'Any'}
          onChange={(event) => {
            const nextValue = event.target.value
            updateFilters({
              baths: nextValue === 'Any' ? undefined : Number(nextValue),
            })
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
  )
}
