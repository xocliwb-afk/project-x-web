import type { Listing } from "@project-x/shared-types";
import { SearchLayoutClient } from "./SearchLayoutClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function fetchListings(): Promise<Listing[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/listings`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function SearchPage() {
  const listings = await fetchListings();

  return <SearchLayoutClient initialListings={listings} />;
}
