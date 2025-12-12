"use client";

import { create } from "zustand";
import type { NormalizedListing } from "@project-x/shared-types";

type MapLensState = {
  activeClusterData: null | {
    listings: NormalizedListing[];
    anchorLatLng: { lat: number; lng: number };
  };
  activateLens: (data: NonNullable<MapLensState["activeClusterData"]>) => void;
  dismissLens: () => void;
  isLocked: boolean;
  setLocked: (isLocked: boolean) => void;
  lockLens: () => void;
};

export const useMapLensStore = create<MapLensState>((set) => ({
  activeClusterData: null,
  isLocked: false,
  setLocked: (isLocked) => {
    console.log("[useMapLensStore] setLocked()", { isLocked });
    set({ isLocked });
  },
  lockLens: () => {
    console.log("[useMapLensStore] lockLens()");
    set({ isLocked: true });
  },
  activateLens: (data) => {
    console.log("[useMapLensStore] activateLens()", {
      listingsCount: data.listings.length,
      anchorLatLng: data.anchorLatLng,
    });
    set({ activeClusterData: data });
  },
  dismissLens: () => {
    console.log("[useMapLensStore] dismissLens()");
    set({ activeClusterData: null, isLocked: false });
  },
}));
