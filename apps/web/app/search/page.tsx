import { fetchListings } from '@/lib/api-client';
import type { ListingSearchParams } from '@project-x/shared-types';
import SearchLayoutClient from './SearchLayoutClient';

type SearchPageProps = {
  searchParams: {
    bbox?: string;
    page?: string;
    limit?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
    baths?: string;
    propertyType?: string;
    sort?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params: ListingSearchParams = {
    bbox: searchParams.bbox,
    page: searchParams.page ? Number(searchParams.page) : undefined,
    limit: searchParams.limit ? Number(searchParams.limit) : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    beds: searchParams.beds ? Number(searchParams.beds) : undefined,
    baths: searchParams.baths ? Number(searchParams.baths) : undefined,
    propertyType: searchParams.propertyType,
    sort: searchParams.sort as ListingSearchParams['sort'] | undefined,
  };

  const { results, pagination } = await fetchListings(params);

  return (
    <SearchLayoutClient
      initialListings={results}
      initialPagination={pagination}
    />
  );
}
