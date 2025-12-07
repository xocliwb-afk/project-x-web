"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Listing as NormalizedListing } from "@project-x/shared-types";
import {
  Listing as CardListing,
  mapNormalizedArrayToListings,
} from "@/lib/mappers";
import { useTheme } from "@/context/ThemeContext";
import { ListingCard } from "@/components/ListingCard";
import Footer from "@/components/Footer";
import { ListingDetailModal } from "@/components/ListingDetailModal";

const MapPanel = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-text-main/60">
      Loading map...
    </div>
  ),
});

interface SearchLayoutClientProps {
  initialListings: NormalizedListing[];
}

export function SearchLayoutClient({
  initialListings,
}: SearchLayoutClientProps) {
  const uiListings: CardListing[] = useMemo(
    () => mapNormalizedArrayToListings(initialListings),
    [initialListings]
  );

  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null
  );
  const [detailListing, setDetailListing] = useState<CardListing | null>(null);

  const { mapSide, paneDominance } = useTheme();
  const isMapLeft = mapSide === "left";
  const isLeftDominant = paneDominance === "left";
  const leftWidth = isLeftDominant ? "md:w-3/5" : "md:w-2/5";
  const rightWidth = isLeftDominant ? "md:w-2/5" : "md:w-3/5";
  const listOnLeft = !isMapLeft;
  const listWidthClass = listOnLeft ? leftWidth : rightWidth;
  const mapWidthClass = listOnLeft ? rightWidth : leftWidth;
  const listOrderClass = listOnLeft ? "order-1 md:order-1" : "order-2 md:order-2";
  const mapOrderClass = listOnLeft ? "order-2 md:order-2" : "order-1 md:order-1";

  useEffect(() => {
    if (!selectedListingId) return;
    const el = document.getElementById(`card-${selectedListingId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedListingId]);

  return (
    <>
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
        <div
          className={[
            "h-full w-full flex flex-col bg-surface border border-border",
            listWidthClass,
            listOrderClass,
          ].join(" ")}
        >
          <div className="flex items-end justify-between border-b border-border bg-surface px-4 py-3 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-text-main">
                Homes for sale
              </h1>
              <p className="text-sm text-text-main/70">
                {uiListings.length} results
              </p>
            </div>
            <button className="rounded-full border border-border px-3 py-1 text-sm text-text-main/80 hover:bg-white/10">
              Sort
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {uiListings.map((listing) => (
                <div
                  id={`card-${listing.id}`}
                  key={listing.id}
                  className="h-full"
                >
                  <ListingCard
                    listing={listing}
                    isSelected={selectedListingId === listing.id}
                    onSelect={() => {
                      setSelectedListingId(listing.id);
                      setDetailListing(listing);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Footer />
            </div>
          </div>
        </div>

        <div
          className={[
            "hidden h-full w-full bg-surface md:block",
            mapWidthClass,
            mapOrderClass,
          ].join(" ")}
        >
          <MapPanel
            listings={initialListings}
            selectedListingId={selectedListingId}
            onSelectListing={(id) => setSelectedListingId(id)}
          />
        </div>
      </div>

      {detailListing && (
        <ListingDetailModal
          listing={detailListing}
          isOpen={!!detailListing}
          onClose={() => setDetailListing(null)}
        />
      )}
    </>
  );
}
