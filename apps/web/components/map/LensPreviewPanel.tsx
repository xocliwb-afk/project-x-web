import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { NormalizedListing } from "@project-x/shared-types";

type LensPreviewPanelProps = {
  listing: NormalizedListing;
  anchor?: { x: number; y: number };
  lensDiameter?: number;
  mapSide?: "left" | "right";
  mapSplitX?: number;
  onViewDetails: () => void;
  panelRef?: React.RefObject<HTMLDivElement>;
  mode?: "fixed" | "attached";
  attachedOffset?: { left: number; top: number };
  previewWidth?: number;
  previewHeight?: number;
  minTop?: number;
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
  panelRef,
  mode = "fixed",
  attachedOffset,
  previewWidth = 320,
  previewHeight = 240,
  minTop = 8,
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
    const gutter = 12;
    const overlapAllowance = 32;
    const padding = 8;
    const radius = (lensDiameter ?? 0) / 2;

    if (mode === "attached" && attachedOffset) {
      return {
        position: "absolute" as const,
        left: attachedOffset.left,
        top: attachedOffset.top,
        width: previewWidth,
        height: previewHeight,
      };
    }

    let desiredLeft =
      mapSide === "left"
        ? (anchor?.x ?? 0) + radius + gutter
        : (anchor?.x ?? 0) - radius - gutter - previewWidth;

    let left = Math.max(padding, Math.min(viewport.width - previewWidth - padding, desiredLeft));

    const desiredTop = (anchor?.y ?? 0) - previewHeight / 2;

    let top = desiredTop;
    const maxTop = viewport.height - previewHeight - padding;
    top = Math.max(minTop ?? padding, Math.min(maxTop, top));

    const finalStyle = {
      position: "fixed" as const,
      left,
      top,
      width: previewWidth,
      height: previewHeight,
    };

    if (process.env.NODE_ENV !== "production" && (left !== desiredLeft || top !== desiredTop)) {
      console.log("[LensPreviewPanel] clamped", {
        mapSide,
        desiredLeft,
        desiredTop,
        left,
        top,
        minTop,
      });
    }

    return finalStyle;
  }, [
    anchor,
    attachedOffset,
    lensDiameter,
    mapSide,
    mapSplitX,
    mode,
    previewHeight,
    previewWidth,
    viewport.height,
    viewport.width,
  ]);

  const primaryPhoto =
    listing.media?.thumbnailUrl ??
    listing.media?.photos?.[0] ??
    "/placeholder-house.jpg";

  return (
    <div
      ref={panelRef as any}
      className={`${mode === "attached" ? "absolute" : "fixed"} z-[9999] overflow-hidden rounded-2xl border border-border/60 bg-white shadow-2xl`}
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
