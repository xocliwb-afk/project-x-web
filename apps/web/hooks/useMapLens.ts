"use client";

import { useCallback, useEffect, useRef } from "react";
import type { NormalizedListing } from "@project-x/shared-types";
import { useMapLensStore } from "@/stores/useMapLensStore";

type MapPosition = { lat: number; lng: number };
type MapLike = {
  latLngToContainerPoint: (latLng: [number, number]) => { x: number; y: number };
  getContainer: () => HTMLElement;
};
type LatLngLike = MapPosition | [number, number];

export function useMapLens({ map }: { map: MapLike | null }) {
  const activateLens = useMapLensStore((s) => s.activateLens);
  const dismissLens = useMapLensStore((s) => s.dismissLens);
  const setLocked = useMapLensStore((s) => s.setLocked);
  const hoverTimerRef = useRef<number | null>(null);

  const toScreenPosition = useCallback(
    (position: MapPosition) => {
      if (!map) return null;
      const containerPoint = map.latLngToContainerPoint([
        position.lat,
        position.lng,
      ]);
      const rect = map.getContainer().getBoundingClientRect();
      return {
        x: rect.left + containerPoint.x,
        y: rect.top + containerPoint.y,
      };
    },
    [map]
  );

  const openLens = useCallback(
    (
      listings: NormalizedListing[],
      position: LatLngLike,
      screenPositionOverride?: { x: number; y: number },
    ) => {
      console.log("[useMapLens] openLens()", {
        listingsCount: listings.length,
        position,
        screenPositionOverride,
      });
      const screenPosition =
        screenPositionOverride ??
        (Array.isArray(position)
          ? toScreenPosition({ lat: position[0], lng: position[1] })
          : toScreenPosition(position as MapPosition));
      console.log("[useMapLens] openLens -> screenPosition", {
        screenPosition,
      });
      if (!screenPosition) return;
      console.log("[useMapLens] openLens -> activateLens");
      activateLens({
        listings,
        mapPosition: Array.isArray(position)
          ? { lat: position[0], lng: position[1] }
          : (position as any),
        screenPosition,
      });
    },
    [activateLens, toScreenPosition]
  );

  const scheduleHover = useCallback(
    (listings: NormalizedListing[], position: MapPosition) => {
      console.log("[useMapLens] scheduleHover()", {
        listingsCount: listings.length,
        position,
      });
      if (!map) return;
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
      setLocked(false);
      hoverTimerRef.current = window.setTimeout(() => {
        console.log("[useMapLens] scheduleHover -> openLens");
        openLens(listings, position);
      }, 150);
    },
    [map, openLens, setLocked]
  );

  const cancelHover = useCallback(
    (dismiss?: boolean) => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (dismiss) {
        dismissLens();
      }
    },
    [dismissLens]
  );

  const openImmediate = useCallback(
    (
      listings: NormalizedListing[],
      position: LatLngLike,
      screenPositionOverride?: { x: number; y: number },
    ) => {
      console.log("[useMapLens] openImmediate()", {
        listingsCount: listings.length,
        position,
        screenPositionOverride,
      });
      useMapLensStore.setState({ isLocked: true });
      cancelHover(false);
      openLens(listings, position, screenPositionOverride);
    },
    [cancelHover, openLens]
  );

  useEffect(
    () => () => {
      cancelHover(false);
    },
    [cancelHover]
  );

  return {
    scheduleHover,
    cancelHover,
    openImmediate,
  };
}
