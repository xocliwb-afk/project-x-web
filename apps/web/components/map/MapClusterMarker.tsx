"use client";

import L from "leaflet";
import { NormalizedListing } from "@project-x/shared-types";

export function createClusterIcon(listings: NormalizedListing[]) {
  const count = listings.length;
  const sizeClass =
    count > 99 ? "h-9 w-9 text-[11px]" : count > 20 ? "h-8 w-8 text-[12px]" : "h-7 w-7 text-[12px]";
  return new L.DivIcon({
    className: "cluster-marker cursor-zoom-in",
    html: `
      <div
        title="Inspect cluster"
        class="relative flex h-12 w-12 items-center justify-center cursor-zoom-in transition-transform duration-200 ease-out hover:scale-110"
      >
        <div class="absolute h-4 w-4 rounded-full bg-blue-500/60 border-[2px] border-white/70 shadow-sm transform -translate-x-2 translate-y-1 -rotate-[20deg]"></div>
        <div class="absolute h-4 w-4 rounded-full bg-blue-500/80 border-[2px] border-white/80 shadow-sm transform translate-x-2 translate-y-1 rotate-[20deg]"></div>
        <div class="absolute h-4 w-4 rounded-full bg-blue-500 border-[2px] border-white shadow-sm transform translate-y-0"></div>

        <div class="relative flex ${sizeClass} items-center justify-center rounded-full bg-white text-primary font-bold ring-2 ring-primary shadow-md">
          <span class="leading-none">
            ${count}
          </span>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  });
}
