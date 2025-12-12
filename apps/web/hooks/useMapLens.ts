"use client";

import { useCallback, useEffect, useRef } from "react";
import type { NormalizedListing } from "@project-x/shared-types";
import { useMapLensStore } from "@/stores/useMapLensStore";

type MapPosition = { lat: number; lng: number };
type LatLngLike = MapPosition | [number, number];

export function useMapLens() {
  const activateLens = useMapLensStore((s) => s.activateLens);
  const dismissLens = useMapLensStore((s) => s.dismissLens);
  const setLocked = useMapLensStore((s) => s.setLocked);
  const hoverTimerRef = useRef<number | null>(null);

  const openLens = useCallback(
    (
      listings: NormalizedListing[],
      position: LatLngLike
    ) => {
      const anchorLatLng = Array.isArray(position)
        ? { lat: position[0], lng: position[1] }
        : position;

      if (!anchorLatLng) return;

      activateLens({
        listings,
        anchorLatLng,
      });
    },
    [activateLens]
  );

  const scheduleHover = useCallback(
    (listings: NormalizedListing[], position: MapPosition) => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
      setLocked(false);
      hoverTimerRef.current = window.setTimeout(() => {
        openLens(listings, position);
      }, 150);
    },
    [openLens, setLocked]
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
    ) => {
      useMapLensStore.setState({ isLocked: true });
      cancelHover(false);
      openLens(listings, position);
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
