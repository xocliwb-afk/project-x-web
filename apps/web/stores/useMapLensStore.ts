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
  focusedListingId: string | null;
  setFocusedListingId: (id: string | null) => void;
};

export const useMapLensStore = create<MapLensState>((set) => ({
  activeClusterData: null,
  isLocked: false,
  focusedListingId: null,
  setFocusedListingId: (focusedListingId) => set({ focusedListingId }),
  setLocked: (isLocked) => {
    set({ isLocked });
  },
  lockLens: () => {
    set({ isLocked: true });
  },
  activateLens: (data) => {
    set({ activeClusterData: data, focusedListingId: null });
  },
  dismissLens: () => {
    set({ activeClusterData: null, isLocked: false, focusedListingId: null });
  },
}));
