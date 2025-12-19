import SearchLayoutClient from './SearchLayoutClient';

export const dynamic = 'force-static';

export default function SearchPage() {
  const emptyPagination = { page: 1, limit: 20, total: 0, hasMore: false, pageCount: 0 };

  return (
    <SearchLayoutClient
      initialListings={[]}
      initialPagination={emptyPagination}
    />
  );
}
