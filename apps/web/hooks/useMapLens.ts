"use client";

import { useCallback } from "react";
import type { NormalizedListing } from "@project-x/shared-types";
import { useMapLensStore } from "@/stores/useMapLensStore";
import type { LatLngBoundsLiteral } from "leaflet";

type MapPosition = { lat: number; lng: number };
type LatLngLike = MapPosition | [number, number];
type OpenLensOptions = {
  bounds?: LatLngBoundsLiteral;
  clusterKey?: string;
};

export function useMapLens() {
  const activateLens = useMapLensStore((s) => s.activateLens);
  const dismissLens = useMapLensStore((s) => s.dismissLens);

  const openLens = useCallback(
    (
      listings: NormalizedListing[],
      position: LatLngLike,
      options?: OpenLensOptions,
    ) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[useMapLens] openLens()", {
          listingsCount: listings.length,
          position,
          clusterKey: options?.clusterKey,
        });
      }

      const anchorLatLng = Array.isArray(position)
        ? { lat: Number(position[0]), lng: Number(position[1]) }
        : { lat: Number((position as any)?.lat), lng: Number((position as any)?.lng) };

      if (!anchorLatLng) return;

      if (process.env.NODE_ENV !== "production") {
        console.log("[useMapLens] openLens -> activateLens");
      }
      activateLens({
        listings,
        anchorLatLng,
        bounds: options?.bounds,
        clusterKey: options?.clusterKey,
      });
    },
    [activateLens]
  );

  const openImmediate = useCallback(
    (
      listings: NormalizedListing[],
      position: LatLngLike,
      options?: OpenLensOptions,
    ) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[openImmediate]", {
          count: listings.length,
          pos: position,
          options,
        });
      }
      openLens(listings, position, options);
    },
    [openLens]
  );

  return {
    openImmediate,
    dismissLens,
  };
}
