"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NormalizedListing } from "@project-x/shared-types";
import { useMapLensStore } from "@/stores/useMapLensStore";

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
  const radius = 130;
  console.log("[MapLens] render", {
    activeClusterDataPresent: Boolean(activeClusterData),
    isLocked,
  });

  const visibleListings = activeClusterData?.listings.slice(0, 12) ?? [];
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
  const positions = useMemo(() => {
    const count = sortedVisibleListings.length;
    if (count === 0) return [];

    const spacing = 42;
    const goldenAngle = 2.39996323;
    return Array.from({ length: count }).map((_, i) => {
      const angle = i * goldenAngle;
      const radius = spacing * Math.sqrt(i);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const maxRadius = 100;
      const scale = radius > maxRadius ? maxRadius / radius : 1;
      return {
        x: x * scale,
        y: y * scale,
        delay: i * 30,
      };
    });
  }, [sortedVisibleListings]);

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
        className="fixed inset-0 bg-black/15 dark:bg-black/25 transition-opacity"
        aria-hidden="true"
      />
      <div
        className="relative h-full w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={lensRef}
          className={`pointer-events-auto -translate-x-1/2 -translate-y-1/2 ${lensTransitionClass} ${lensVisibilityClass}`}
          style={{
            left: clampedX,
            top: clampedY,
            position: "absolute",
          }}
        >
          <div className="relative flex flex-col items-center">
            <div
              className="relative h-[260px] w-[260px] rounded-full border border-border/40 bg-gradient-to-b from-surface/20 via-surface/10 to-surface/30 shadow-[0_12px_40px_rgba(15,23,42,0.25)] backdrop-blur-2xl"
            >
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-2 top-2 z-20 h-7 w-7 rounded-full bg-black/60 text-white text-sm font-semibold transition hover:bg-black/80"
              >
                ×
              </button>
              {sortedVisibleListings.map((listing, idx) => {
                const pos = positions[idx] || { x: 0, y: 0, delay: 0 };
                const isFocused = focusedListingId === listing.id;
                const bubbleBase =
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-semibold text-text-main shadow-sm backdrop-blur-sm transition-transform transition-shadow duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-md hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer";
                const bubbleFocused =
                  "bg-primary text-primary-foreground border-primary shadow-lg -translate-y-[2px] scale-105";
                return (
                  <button
                    key={listing.id}
                    className={`${bubbleBase} ${isFocused ? bubbleFocused : ""}`}
                    style={{
                      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${visible ? 1 : 0.75})`,
                      opacity: visible ? 1 : 0,
                      transitionDuration: "220ms",
                      transitionTimingFunction: "ease-out",
                      transitionProperty: "transform, opacity",
                      transitionDelay: `${pos.delay}ms`,
                    }}
                    onMouseEnter={() => onHoverListing?.(listing.id)}
                    onMouseLeave={() => onHoverListing?.(null)}
                    onClick={() => {
                      setFocusedListingId(listing.id);
                      onHoverListing?.(listing.id);
                    }}
                  >
                    {formatPriceCompact(typeof listing.listPrice === "number" ? listing.listPrice : null)}
                  </button>
                );
              })}
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
