import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { NormalizedListing } from "@project-x/shared-types";

type LensPreviewPanelProps = {
  listing: NormalizedListing;
  anchor: { x: number; y: number };
  lensDiameter: number;
  mapSide?: "left" | "right";
  mapSplitX?: number;
  onViewDetails: () => void;
};

const formatPriceCompact = (price: number | null | undefined) => {
  if (!price || price <= 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(price);
};

export function LensPreviewPanel({
  listing,
  anchor,
  lensDiameter,
  mapSide = "left",
  mapSplitX,
  onViewDetails,
}: LensPreviewPanelProps) {
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  useEffect(() => {
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const style = useMemo(() => {
    const previewWidth = 320;
    const previewHeight = 240;
    const gutter = 12;
    const overlapAllowance = 32;
    const padding = 8;
    const radius = lensDiameter / 2;
    const split = mapSplitX ?? viewport.width / 2;

    let desiredLeft =
      mapSide === "left"
        ? anchor.x + radius + gutter
        : anchor.x - radius - gutter - previewWidth;

    let minLeft: number;
    let maxLeft: number;

    if (mapSide === "left") {
      // list on the right
      minLeft = split - overlapAllowance;
      maxLeft = viewport.width - previewWidth - padding;
    } else {
      // list on the left
      minLeft = padding;
      maxLeft = split - previewWidth + overlapAllowance;
    }

    let left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));

    if (process.env.NODE_ENV !== "production") {
      const crossesMapSide =
        (mapSide === "left" && left < minLeft) ||
        (mapSide === "right" && left + previewWidth > maxLeft + previewWidth - overlapAllowance);
      if (crossesMapSide) {
        console.warn("[LensPreviewPanel] clamped to list side", {
          mapSide,
          split,
          desiredLeft,
          left,
          minLeft,
          maxLeft,
        });
      }
    }

    let top = anchor.y - previewHeight / 2;
    const minTop = 8;
    const maxTop = viewport.height - previewHeight - 8;
    top = Math.max(minTop, Math.min(maxTop, top));

    return {
      left,
      top,
      width: previewWidth,
      height: previewHeight,
    };
  }, [anchor, lensDiameter, mapSide, viewport.height, viewport.width]);

  const primaryPhoto =
    listing.media?.thumbnailUrl ??
    listing.media?.photos?.[0] ??
    "/placeholder-house.jpg";

  return (
    <div
      className="fixed z-[1050] overflow-hidden rounded-2xl border border-border/60 bg-white shadow-2xl"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full h-[140px] overflow-hidden bg-slate-200">
        <Image
          src={primaryPhoto}
          alt={listing.address?.full ?? "Listing photo"}
          fill
          sizes="320px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-1 p-3 text-text-main">
        <div className="text-lg font-semibold leading-tight">
          {formatPriceCompact(
            typeof listing.listPrice === "number" ? listing.listPrice : null
          )}
        </div>
        <div className="text-sm text-slate-600 line-clamp-2">
          {listing.address?.full || "Address unavailable"}
        </div>
        <div className="text-xs text-slate-600">
          {(listing.details?.beds ?? "—").toString()} bd •{" "}
          {(listing.details?.baths ?? "—").toString()} ba
          {typeof listing.details?.sqft === "number" && listing.details.sqft > 0
            ? ` • ${listing.details.sqft.toLocaleString()} sqft`
            : ""}
        </div>
        <div className="pt-2">
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground transition hover:brightness-95"
            onClick={onViewDetails}
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
