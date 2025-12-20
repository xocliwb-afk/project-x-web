"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { LensMiniMap } from "./LensMiniMap";
import type { LatLngBounds } from "leaflet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { LensPreviewPanel } from "./LensPreviewPanel";

type MapLensProps = {
  onHoverListing?: (id: string | null) => void;
  onSelectListing?: (id: string | null) => void;
  isMobile?: boolean;
  mapSide?: "left" | "right";
  mapSplitX?: number;
};

const formatPriceCompact = (price: number | null | undefined) => {
  if (!price || price <= 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(price);
};

export function MapLens({
  onHoverListing,
  onSelectListing,
  isMobile,
  mapSide = "left",
  mapSplitX,
}: MapLensProps) {
  const activeClusterData = useMapLensStore((s) => s.activeClusterData);
  const dismissLens = useMapLensStore((s) => s.dismissLens);
  const isLocked = useMapLensStore((s) => s.isLocked);
  const [visible, setVisible] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [anchorCenter, setAnchorCenter] = useState<{ x: number; y: number } | null>(null);
  const focusedListingId = useMapLensStore((s) => s.focusedListingId);
  const setFocusedListingId = useMapLensStore((s) => s.setFocusedListingId);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const mobileDetected = useIsMobile();

  const allClusterListings = activeClusterData?.listings ?? [];
  const sortedAllListings = useMemo(
    () =>
      [...allClusterListings].sort((a, b) => {
        const priceA =
          typeof a.listPrice === "number" ? a.listPrice : typeof a.listPrice === "string" ? Number(a.listPrice) : 0;
        const priceB =
          typeof b.listPrice === "number" ? b.listPrice : typeof b.listPrice === "string" ? Number(b.listPrice) : 0;
        return priceB - priceA;
      }),
    [allClusterListings]
  );
  const visibleListings = sortedAllListings.slice(0, 50);

  const clusterBounds = useMemo(() => {
    if (typeof window === "undefined" || !(window as any).L || !activeClusterData)
      return null;
    const L = (window as any).L;
    if (activeClusterData.bounds) {
      const { swLat, swLng, neLat, neLng } = activeClusterData.bounds;
      const manualBounds = L.latLngBounds(
        [swLat, swLng],
        [neLat, neLng],
      );
      if (manualBounds.isValid()) {
        return manualBounds as LatLngBounds;
      }
    }
    const bounds = L.latLngBounds([]);
    allClusterListings.forEach((l) => {
      if (
        typeof l.address?.lat === "number" &&
        typeof l.address?.lng === "number"
      ) {
        bounds.extend([l.address.lat, l.address.lng]);
      }
    });
    return bounds.isValid() ? (bounds as LatLngBounds) : null;
  }, [activeClusterData, allClusterListings]);

  const lensSizePx = useMemo(() => {
    const base = viewportWidth * 0.78;
    return Math.min(350, Math.max(240, base));
  }, [viewportWidth]);
  const lensDiameter = activeClusterData?.lensDiameter ?? lensSizePx;
  const lensKey = useMemo(() => {
    if (!activeClusterData) return "lens-none";
    const { lat, lng } = activeClusterData.anchorLatLng;
    return `lens-${lat.toFixed(5)}-${lng.toFixed(5)}-${activeClusterData.listings.length}`;
  }, [activeClusterData]);

  useEffect(() => {
    setVisible(Boolean(activeClusterData));
  }, [activeClusterData]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const updateAnchor = () => {
      if (!lensRef.current) return;
      window.requestAnimationFrame(() => {
        if (!lensRef.current) return;
        const rect = lensRef.current.getBoundingClientRect();
        setAnchorCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      });
    };
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [visible, lensDiameter, activeClusterData]);

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
        handleDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleDismiss]);

  const focusedListing = useMemo(
    () => sortedAllListings.find((l) => l.id === focusedListingId) ?? null,
    [sortedAllListings, focusedListingId]
  );
  const previewListing = focusedListing ?? sortedAllListings[0] ?? null;

  const lensTransitionClass =
    "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";
  const lensVisibilityClass = visible
    ? "opacity-100 scale-100"
    : "opacity-0 scale-50";

  const isMobileView = (isMobile ?? false) || mobileDetected;

  useEffect(() => {
    if (!isMobileView || !activeClusterData) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isMobileView, activeClusterData]);

  if (!activeClusterData || allClusterListings.length === 0) {
    return null;
  }

  const goToListing = (id: string) => {
    onSelectListing?.(id);
    router.push(`/listing/${id}`);
    handleDismiss();
  };

  if (isMobileView) {
    const modal = (
      <div className="fixed inset-0 z-[99999] pt-[env(safe-area-inset-top)]">
        <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
        <div className="relative z-10 flex h-full flex-col gap-3 p-4">
          <div className="flex justify-end">
            <button
              type="button"
              aria-label="Close lens"
              className="rounded-full bg-white/90 px-3 py-1 text-lg font-semibold shadow"
              onClick={handleDismiss}
            >
              ×
            </button>
          </div>
          <div
            className="flex-1 overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-64 border-b border-border">
              <LensMiniMap
                key={lensKey}
                center={[
                  activeClusterData.anchorLatLng?.lat,
                  activeClusterData.anchorLatLng?.lng,
                ]}
                listings={sortedAllListings}
                bounds={clusterBounds}
                onMarkerClick={(listing) => {
                  setFocusedListingId(listing.id);
                  onHoverListing?.(listing.id);
                }}
              />
            </div>
            <div className="flex h-[calc(100%-16rem)] flex-col p-4 overflow-hidden">
              {focusedListing ? (
                <button
                  type="button"
                  onClick={() => goToListing(focusedListing.id)}
                  className="flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-white text-left shadow-sm transition active:scale-[0.99]"
                >
                  <div className="relative w-full overflow-hidden rounded-xl bg-slate-200 aspect-[16/9]">
                    <Image
                      src={
                        focusedListing.media?.thumbnailUrl ??
                        focusedListing.media?.photos?.[0] ??
                        "/placeholder-house.jpg"
                      }
                      alt={focusedListing.address?.full ?? "Listing photo"}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
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
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-lg">
                      ☆
                    </span>
                  </div>

                      <div className="text-xs text-text-secondary">
                        Tap to open full listing
                      </div>
                </button>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                  Select a pin to preview.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
    if (typeof document === "undefined") return modal;
    return createPortal(modal, document.body);
  }

  return (
    <div
      ref={lensRef}
      className={`pointer-events-auto ${lensTransitionClass} ${lensVisibilityClass}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex flex-col items-center">
        <div
          style={{ width: lensDiameter, height: lensDiameter }}
          className="relative rounded-full overflow-hidden border-2 border-border/70 bg-surface/10 shadow-2xl backdrop-blur-lg"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked && e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          {process.env.NODE_ENV !== "production" && (
            <div className="absolute left-2 top-2 z-10 rounded bg-black/40 px-2 py-1 text-[11px] text-white leading-tight pointer-events-none">
              <div>clusterListings: {sortedAllListings.length}</div>
              {activeClusterData.bounds && (
                <div className="mt-0.5">
                  bounds: {activeClusterData.bounds.swLng?.toFixed(4)},
                  {activeClusterData.bounds.swLat?.toFixed(4)} →{" "}
                  {activeClusterData.bounds.neLng?.toFixed(4)},
                  {activeClusterData.bounds.neLat?.toFixed(4)}
                </div>
              )}
            </div>
          )}
          <LensMiniMap
            key={lensKey}
            center={[
              activeClusterData.anchorLatLng?.lat,
              activeClusterData.anchorLatLng?.lng,
            ]}
            listings={sortedAllListings}
            bounds={clusterBounds}
            onMarkerClick={(listing) => {
              setFocusedListingId(listing.id);
              onHoverListing?.(listing.id);
            }}
          />
        </div>

        {previewListing && anchorCenter && (
          <LensPreviewPanel
            listing={previewListing}
            anchor={anchorCenter}
            lensDiameter={lensDiameter}
            mapSide={mapSide}
            mapSplitX={mapSplitX}
            onViewDetails={() => {
              onSelectListing?.(previewListing.id);
              goToListing(previewListing.id);
            }}
          />
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
