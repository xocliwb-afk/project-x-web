import SearchFiltersBar from "../../components/SearchFiltersBar";
import { SearchLayoutClient } from "./SearchLayoutClient";
import type { ListingSearchParams, NormalizedListing } from "@project-x/shared-types";

// Fetch logic
async function getListings(searchParams: ListingSearchParams) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.minPrice) params.set("minPrice", String(searchParams.minPrice));
  if (searchParams.maxPrice) params.set("maxPrice", String(searchParams.maxPrice));
  if (searchParams.minBeds) params.set("minBeds", String(searchParams.minBeds));
  if (searchParams.minBaths) params.set("minBaths", String(searchParams.minBaths));
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.propertyType) params.set("propertyType", searchParams.propertyType);
  if (searchParams.minSqft) params.set("minSqft", String(searchParams.minSqft));
  if (searchParams.maxDaysOnMarket) params.set("maxDaysOnMarket", String(searchParams.maxDaysOnMarket));

  // Assuming API is running locally on 3001
  const res = await fetch(`http://localhost:3001/api/listings?${params.toString()}`, {
    cache: "no-store",
  });
  
  if (!res.ok) return [];
  return res.json() as Promise<NormalizedListing[]>;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const domainParams: ListingSearchParams = {
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    minPrice: Number(searchParams.minPrice) || undefined,
    maxPrice: Number(searchParams.maxPrice) || undefined,
    minBeds: Number(searchParams.minBeds) || undefined,
    minBaths: Number(searchParams.minBaths) || undefined,
    status: typeof searchParams.status === 'string' ? (searchParams.status as any) : undefined,
    propertyType: typeof searchParams.propertyType === 'string' ? (searchParams.propertyType as any) : undefined,
    minSqft: Number(searchParams.minSqft) || undefined,
    maxDaysOnMarket: Number(searchParams.maxDaysOnMarket) || undefined,
  };

  const normalizedListings = await getListings(domainParams);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-900 text-slate-50">
      <header className="z-40 flex shrink-0 flex-col border-b border-slate-800 bg-slate-950 shadow-sm">
         <div className="h-14 flex items-center px-6 font-bold tracking-widest text-xs uppercase text-slate-400">
            Project X <span className="text-orange-500 ml-2">// Search</span>
         </div>
         <SearchFiltersBar />
      </header>

      <SearchLayoutClient initialListings={normalizedListings} />
    </div>
  );
}