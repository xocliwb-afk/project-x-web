"use client";

import L from "leaflet";
import { NormalizedListing } from "@project-x/shared-types";

export function createClusterIcon(listings: NormalizedListing[]) {
  return new L.DivIcon({
    className: "cluster-marker cursor-zoom-in",
    html: `
      <div
        title="Inspect cluster"
        class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-surface/90 shadow-[0_0_12px_rgba(15,23,42,0.25)] backdrop-blur-sm cursor-zoom-in"
      >
        <span class="font-bold text-primary text-base leading-none">
          ${listings.length}
        </span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}
