"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { LensMiniMap } from "./LensMiniMap";

type MapLensProps = {
  onHoverListing?: (id: string | null) => void;
  onSelectListing?: (id: string | null) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [focusedListingId, setFocusedListingId] = useState<string | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const radius = 175;
  console.log("[MapLens] render", {
    activeClusterDataPresent: Boolean(activeClusterData),
    isLocked,
  });

  const visibleListings = activeClusterData?.listings.slice(0, 50) ?? [];
  console.log("[MapLens] visibleListings", {
    count: visibleListings.length,
  });
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
    if (!activeClusterData) return null;
    const bounds = L.latLngBounds([]);
    activeClusterData.listings.forEach((l) => {
      if (typeof l.address?.lat === "number" && typeof l.address?.lng === "number") {
        bounds.extend([l.address.lat, l.address.lng]);
      }
    });
    return bounds.isValid() ? bounds : null;
  }, [activeClusterData]);

  const lensSizePx = useMemo(() => {
    const defaultSize = 350;
    if (!clusterBounds || !clusterBounds.isValid()) {
      return defaultSize;
    }
    const sw = clusterBounds.getSouthWest();
    const ne = clusterBounds.getNorthEast();
    const diagonalMeters = sw.distanceTo(ne);
    let viewportBase = 1024;
    if (typeof window !== "undefined") {
      viewportBase = Math.min(window.innerWidth, window.innerHeight);
    }
    let size = 0.28 * viewportBase;
    if (diagonalMeters > 3000) {
      size = 0.34 * viewportBase;
    }
    if (diagonalMeters > 12000) {
      size = 0.42 * viewportBase;
    }
    size = Math.max(320, Math.min(480, size));
    return size;
  }, [clusterBounds]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setVisible(Boolean(activeClusterData));
  }, [activeClusterData]);

  const handleDismiss = useCallback(() => {
    setFocusedListingId(null);
    dismissLens();
    onHoverListing?.(null);
  }, [dismissLens, onHoverListing]);

  useEffect(() => {
    setFocusedListingId(null);
  }, [activeClusterData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissLens();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dismissLens]);

  const focusedListing = useMemo(
    () => sortedVisibleListings.find((l) => l.id === focusedListingId) ?? null,
    [sortedVisibleListings, focusedListingId]
  );
  console.log("[MapLens] focusedListing", {
    focusedListingId,
    focusedListingPresent: Boolean(focusedListing),
  });

  console.log("[MapLens] before guard", {
    mounted,
    hasActiveClusterData: Boolean(activeClusterData),
    visibleCount: visibleListings.length,
  });
  if (!mounted || !activeClusterData || visibleListings.length === 0) {
    return null;
  }

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

  const clampedX = clamp(
    activeClusterData.screenPosition.x,
    radius + 16,
    viewportWidth - radius - 16
  );
  const clampedY = clamp(
    activeClusterData.screenPosition.y,
    radius + 16,
    viewportHeight - radius - 16
  );
  const cardHeight = 140;
  const cardMargin = 12;
  const shouldFlipCard =
    clampedY + radius + cardHeight + cardMargin > viewportHeight;
  const lensTransitionClass =
    "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";
  const lensVisibilityClass = visible ? "opacity-100 scale-100" : "opacity-0 scale-50";
  console.log("[MapLens] rendering portal");
  return createPortal(
    <div
      className="fixed inset-0 z-[2000] pointer-events-auto"
      onClick={handleDismiss}
    >
      <div
        className="fixed inset-0 bg-black/5 dark:bg-black/10 transition-opacity"
        aria-hidden="true"
      />
      <div
        className="relative h-full w-full"
      >
        <div
          ref={lensRef}
          className={`pointer-events-auto -translate-x-1/2 -translate-y-1/2 ${lensTransitionClass} ${lensVisibilityClass}`}
          style={{
            left: clampedX,
            top: clampedY,
            position: "absolute",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex flex-col items-center">
            <div
              style={{ width: lensSizePx, height: lensSizePx }}
              className="relative rounded-full overflow-hidden border-4 border-black/80 bg-surface/10 shadow-[0_14px_44px_rgba(15,23,42,0.3)] backdrop-blur-2xl"
            >
              <LensMiniMap
                center={[
                  (activeClusterData.mapPosition?.lat as number) ||
                    (activeClusterData.listings.find(
                      (l) =>
                        typeof l.address?.lat === "number" &&
                        typeof l.address?.lng === "number"
                    )?.address.lat as number) ||
                    0,
                  (activeClusterData.mapPosition?.lng as number) ||
                    (activeClusterData.listings.find(
                      (l) =>
                        typeof l.address?.lat === "number" &&
                        typeof l.address?.lng === "number"
                    )?.address.lng as number) ||
                    0,
                ]}
                listings={sortedVisibleListings}
                bounds={clusterBounds}
                onMarkerClick={(listing) => {
                  setFocusedListingId(listing.id);
                  onHoverListing?.(listing.id);
                  onSelectListing?.(listing.id);
                }}
              />
            </div>

            {isLocked && focusedListing && (
              <div
                className={`absolute left-1/2 ${
                  shouldFlipCard ? "bottom-full mb-3" : "top-full mt-3"
                } -translate-x-1/2`}
              >
                <div
                  className={`w-72 rounded-xl bg-surface/90 backdrop-blur-md shadow-2xl border border-border/60 p-3 flex gap-3 items-center transition-all duration-200 ease-out ${
                    focusedListing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                >
                {focusedListing.media?.photos?.[0] && (
                  <img
                    src={focusedListing.media.photos[0]}
                    alt={focusedListing.address?.full ?? "Listing photo"}
                    className="h-20 w-24 rounded-md object-cover flex-shrink-0"
                  />
                )}
                <div className="flex flex-col gap-1 text-xs text-text-main">
                  <div className="text-2xl font-bold text-text-main leading-tight">
                    {formatPriceCompact(
                      typeof focusedListing.listPrice === "number"
                        ? focusedListing.listPrice
                        : null
                    )}
                  </div>
                  <div className="text-sm text-text-secondary line-clamp-2">
                    {focusedListing.address?.full || "Address unavailable"}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {(focusedListing.details?.beds ?? "—").toString()} bd • {(focusedListing.details?.baths ?? "—").toString()} ba
                    {typeof focusedListing.details?.sqft === "number" && focusedListing.details.sqft > 0
                      ? ` • ${focusedListing.details.sqft.toLocaleString()} sqft`
                      : ""}
                  </div>
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground transition hover:brightness-95"
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
            )}
            {isLocked && (
              <div className="mt-2 text-[11px] text-text-secondary">
                {focusedListing
                  ? "Use \"View details\" to open the listing."
                  : "Click a price to preview details."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
