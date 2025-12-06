"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ListingCard } from "../../components/ListingCard"; 
import { ListingDetailModal } from "../../components/ListingDetailModal";
import type { NormalizedListing } from "@project-x/shared-types";
import { mapNormalizedArrayToListings } from "../../lib/mappers";
import type { Listing } from "../../lib/mappers";

// Lazy load Map to avoid SSR window errors
const MapPanel = dynamic(() => import("../../components/MapPanel"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800 animate-pulse" />
});

export function SearchLayoutClient({ initialListings }: { initialListings: NormalizedListing[] }) {
  const uiListings = useMemo(() => mapNormalizedArrayToListings(initialListings), [initialListings]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  return (
    <div className="relative flex-1 overflow-hidden lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      
      {/* List Column */}
      <div className="flex h-full flex-col overflow-y-auto bg-slate-900">
        <div className="p-4 text-xs text-slate-400 font-mono uppercase tracking-widest mb-2">
          {uiListings.length} Results Found
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {uiListings.map((l) => (
            <ListingCard 
              key={l.id} 
              listing={l} 
              onSelect={() => setSelectedListing(l)} 
            />
          ))}
        </div>
      </div>

      {/* Map Column */}
      <div className="relative h-full w-full bg-slate-800">
        <MapPanel 
          listings={uiListings} 
          isDark={true}
          onListingSelect={setSelectedListing} 
        />
      </div>

      {/* Modal */}
      <ListingDetailModal 
        listing={selectedListing} 
        isOpen={!!selectedListing} 
        onClose={() => setSelectedListing(null)} 
      />
    </div>
  );
}