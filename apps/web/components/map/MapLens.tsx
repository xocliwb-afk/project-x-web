"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { LensMiniMap } from "./LensMiniMap";
import type { LatLngBounds } from "leaflet";

type MapLensProps = {
  onHoverListing?: (id: string | null) => void;
  onSelectListing?: (id: string | null) => void;
};

const formatPriceCompact = (price: number | null | undefined) => {
  if (!price || price <= 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(price);
};

export function MapLens({ onHoverListing, onSelectListing }: MapLensProps) {
  const activeClusterData = useMapLensStore((s) => s.activeClusterData);
  const dismissLens = useMapLensStore((s) => s.dismissLens);
  const isLocked = useMapLensStore((s) => s.isLocked);
  const focusedListingId = useMapLensStore((s) => s.focusedListingId);
  const setFocusedListingId = useMapLensStore((s) => s.setFocusedListingId);
  const [visible, setVisible] = useState(false);
  const lensRef = useRef<HTMLDivElement | null>(null);

  const visibleListings = activeClusterData?.listings.slice(0, 50) ?? [];
  const sortedVisibleListings = useMemo(
    () =>
      [...visibleListings].sort((a, b) => {
        const priceA =
          typeof a.listPrice === "number" ? a.listPrice : typeof a.listPrice === "string" ? Number(a.listPrice) : 0;
        const priceB =
          typeof b.listPrice === "number" ? b.listPrice : typeof b.listPrice === "string" ? Number(b.listPrice) : 0;
        return priceB - priceA;
      }),
    [visibleListings]
  );

    const clusterBounds = useMemo(() => {
    if (typeof window === "undefined" || !(window as any).L || !activeClusterData)
      return null;
    const L = (window as any).L;
    const bounds = L.latLngBounds([]);
    activeClusterData.listings.forEach((l) => {
      if (
        typeof l.address?.lat === "number" &&
        typeof l.address?.lng === "number"
      ) {
        bounds.extend([l.address.lat, l.address.lng]);
      }
    });
    return bounds.isValid() ? (bounds as LatLngBounds) : null;
  }, [activeClusterData]);

  const lensSizePx = 350; // Fixed size

  useEffect(() => {
    setVisible(Boolean(activeClusterData));
  }, [activeClusterData]);

  const handleDismiss = useCallback(() => {
    setFocusedListingId(null);
    dismissLens();
    onHoverListing?.(null);
  }, [dismissLens, onHoverListing, setFocusedListingId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleDismiss]);

  const focusedListing = useMemo(
    () => sortedVisibleListings.find((l) => l.id === focusedListingId) ?? null,
    [sortedVisibleListings, focusedListingId]
  );

  if (!activeClusterData || visibleListings.length === 0) {
    return null;
  }

  // Simple heuristic to decide if the card should render above or below the lens
  const shouldFlipCard = activeClusterData.anchorLatLng.lat < 35; 

  const lensTransitionClass =
    "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";
  const lensVisibilityClass = visible
    ? "opacity-100 scale-100"
    : "opacity-0 scale-50";

  return (
    <div
      ref={lensRef}
      className={`pointer-events-auto ${lensTransitionClass} ${lensVisibilityClass}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex flex-col items-center">
        <div
          style={{ width: lensSizePx, height: lensSizePx }}
          className="relative rounded-full overflow-hidden border-2 border-border/70 bg-surface/10 shadow-2xl backdrop-blur-lg"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            aria-label="Close lens"
          >
            ×
          </button>
          <LensMiniMap
            center={[
              activeClusterData.anchorLatLng?.lat,
              activeClusterData.anchorLatLng?.lng,
            ]}
            listings={sortedVisibleListings}
            bounds={clusterBounds}
            onMarkerClick={(listing) => {
              setFocusedListingId(listing.id);
              onHoverListing?.(listing.id);
            }}
          />
        </div>

        {focusedListing && (
          <div
            className={`absolute left-1/2 ${
              shouldFlipCard ? "bottom-full mb-3" : "top-full mt-3"
            } -translate-x-1/2`}
          >
            <div
              className={`w-80 max-w-sm rounded-2xl bg-white shadow-lg border border-border/60 p-4 transition-all duration-200 ease-out ${
                focusedListing
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
            >
              <div className="flex flex-col gap-3 w-full">
                <div className="relative w-full overflow-hidden rounded-xl bg-slate-200 aspect-[4/3]">
                  <Image
                    src={
                      focusedListing.media?.thumbnailUrl ??
                      (focusedListing.media?.photos?.[0] ??
                        "/placeholder-house.jpg")
                    }
                    alt={focusedListing.address?.full ?? "Listing photo"}
                    fill
                    sizes="(min-width: 1024px) 320px, 80vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 text-text-main">
                  <div className="text-lg font-semibold leading-tight">
                    {formatPriceCompact(
                      typeof focusedListing.listPrice === "number"
                        ? focusedListing.listPrice
                        : null
                    )}
                  </div>
                  <div className="text-sm text-slate-600 line-clamp-2">
                    {focusedListing.address?.full || "Address unavailable"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {(focusedListing.details?.beds ?? "—").toString()} bd •{" "}
                    {(focusedListing.details?.baths ?? "—").toString()} ba
                    {typeof focusedListing.details?.sqft === "number" &&
                    focusedListing.details.sqft > 0
                      ? ` • ${focusedListing.details.sqft.toLocaleString()} sqft`
                      : ""}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center self-start rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground transition hover:brightness-95"
                      onClick={() => {
                        onSelectListing?.(focusedListing.id);
                        handleDismiss();
                      }}
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isLocked && (
          <div className="mt-2 text-[11px] text-text-secondary">
            {focusedListing
              ? 'Use "View details" to open the listing.'
              : "Click a price to preview details."}
          </div>
        )}
      </div>
    </div>
  );
}
