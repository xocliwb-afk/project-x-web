import SearchLayoutClient from './SearchLayoutClient';

export const dynamic = 'force-static';

export default function SearchPage() {
  const emptyPagination = { page: 1, limit: 20, total: 0, hasMore: false };

  return (
    <SearchLayoutClient
      initialListings={[]}
      initialPagination={emptyPagination}
    />
  );
}
