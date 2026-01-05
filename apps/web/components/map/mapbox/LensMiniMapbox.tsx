"use client";

import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { NormalizedListing } from "@project-x/shared-types";
import { listingsToGeoJSON } from "./mapbox-utils";
import type { LatLngBoundsTuple } from "../types";

type LensMiniMapboxProps = {
  center: [number, number];
  listings: NormalizedListing[];
  bounds?: LatLngBoundsTuple | null;
  focusedListingId?: string | null;
  onMarkerClick: (listing: NormalizedListing) => void;
};

const SOURCE_ID = "lens-mini-listings";
const LAYER_ID = "lens-mini-points";

const convertBoundsToMapbox = (bounds: LatLngBoundsTuple) =>
  [
    [bounds[0][1], bounds[0][0]],
    [bounds[1][1], bounds[1][0]],
  ] as [mapboxgl.LngLatLike, mapboxgl.LngLatLike];

export function LensMiniMapbox({
  center,
  listings,
  bounds,
  focusedListingId,
  onMarkerClick,
}: LensMiniMapboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const sourceReadyRef = useRef(false);
  const pendingBoundsRef = useRef<ReturnType<typeof convertBoundsToMapbox> | null>(null);
  const lastFocusedIdRef = useRef<string | null>(null);
  const initialCenterRef = useRef<[number, number]>(center);
  const listingsRef = useRef(listings);
  const listingsByIdRef = useRef(new Map<string, NormalizedListing>());
  const tokenRef = useRef<string | undefined>(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    listingsRef.current = listings;
    listingsByIdRef.current = new Map(listings.map((l) => [String(l.id), l]));
  }, [listings]);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const applyFocusedState = useCallback((targetId: string | null) => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) {
      lastFocusedIdRef.current = targetId;
      return;
    }
    if (!map.getSource(SOURCE_ID)) {
      lastFocusedIdRef.current = targetId;
      return;
    }

    if (lastFocusedIdRef.current) {
      map.setFeatureState({ source: SOURCE_ID, id: lastFocusedIdRef.current }, { focused: false });
    }

    if (targetId) {
      map.setFeatureState({ source: SOURCE_ID, id: targetId }, { focused: true });
    }

    lastFocusedIdRef.current = targetId;
  }, []);

  const applyBounds = useCallback((targetBounds: LatLngBoundsTuple | null) => {
    const map = mapRef.current;
    if (!map) return;

    if (!targetBounds) {
      pendingBoundsRef.current = null;
      return;
    }

    const mapboxBounds = convertBoundsToMapbox(targetBounds);
    if (sourceReadyRef.current) {
      map.fitBounds(mapboxBounds, { padding: 20, animate: false });
    } else {
      pendingBoundsRef.current = mapboxBounds;
    }
  }, []);

  useEffect(() => {
    applyFocusedState(focusedListingId ?? null);
  }, [applyFocusedState, focusedListingId]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(listingsToGeoJSON(listings));
      applyFocusedState(focusedListingId ?? null);
    }
  }, [applyFocusedState, listings, focusedListingId]);

  useEffect(() => {
    applyBounds(bounds ?? null);
  }, [applyBounds, bounds]);

  useEffect(() => {
    const container = containerRef.current;
    const token = tokenRef.current;
    if (!container || !token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialCenterRef.current[1] ?? 0, initialCenterRef.current[0] ?? 0],
      zoom: 13,
      interactive: true,
      attributionControl: false,
    });

    const canvas = map.getCanvas();
    canvas.style.cursor = "grab";

    map.dragPan.disable();
    map.scrollZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    map.keyboard.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    const pillId = "lens-price-pill";
    if (!map.hasImage(pillId)) {
      const width = 72;
      const height = 30;
      const radius = 15;
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.quadraticCurveTo(width, 0, width, radius);
        ctx.lineTo(width, height - radius);
        ctx.quadraticCurveTo(width, height, width - radius, height);
        ctx.lineTo(radius, height);
        ctx.quadraticCurveTo(0, height, 0, height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        map.addImage(pillId, ctx.getImageData(0, 0, canvas.width, canvas.height), {
          pixelRatio: 2,
        });
      }
    }

    const handlePointClick = (e: mapboxgl.MapLayerMouseEvent) => {
      e.originalEvent?.stopPropagation?.();
      const feature = e.features?.[0];
      const id = feature?.properties?.id;
      if (!id) return;
      const listing = listingsByIdRef.current.get(String(id));
      if (!listing) return;
      onMarkerClickRef.current?.(listing);
    };

    const handlePointEnter = () => {
      canvas.style.cursor = "pointer";
    };

    const handlePointLeave = () => {
      canvas.style.cursor = "grab";
    };

    const handleLoad = () => {
      const sourceData = listingsToGeoJSON(listingsRef.current);
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: sourceData,
      });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": ["case", ["boolean", ["feature-state", "focused"], false], 9, 7],
          "circle-color": ["case", ["boolean", ["feature-state", "focused"], false], "#2563eb", "#111827"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });
      map.addLayer({
        id: "lens-mini-price",
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "text-field": ["get", "priceLabel"],
          "text-size": 14,
          "icon-image": "lens-price-pill",
          "icon-text-fit": "both",
          "icon-text-fit-padding": [5, 8, 5, 8],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-anchor": "center",
          "text-font": ["DIN Offc Pro Bold", "DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-anchor": "center",
          "text-offset": [0, 0],
          "text-padding": 2,
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#0f172a",
          "text-halo-width": 0,
        },
      });

      map.on("mouseenter", LAYER_ID, handlePointEnter);
      map.on("mouseleave", LAYER_ID, handlePointLeave);
      map.on("click", LAYER_ID, handlePointClick);
      map.on("mouseenter", "lens-mini-price", handlePointEnter);
      map.on("mouseleave", "lens-mini-price", handlePointLeave);
      map.on("click", "lens-mini-price", handlePointClick);
      sourceReadyRef.current = true;

      if (pendingBoundsRef.current) {
        map.fitBounds(pendingBoundsRef.current, { padding: 20, animate: false });
        pendingBoundsRef.current = null;
      }

      applyFocusedState(lastFocusedIdRef.current);
      map.resize();
      requestAnimationFrame(() => map.resize());

    };

    map.on("load", handleLoad);
    mapRef.current = map;

    return () => {
      map.off("load", handleLoad);
      map.off("mouseenter", LAYER_ID, handlePointEnter);
      map.off("mouseleave", LAYER_ID, handlePointLeave);
      map.off("click", LAYER_ID, handlePointClick);
      map.off("mouseenter", "lens-mini-price", handlePointEnter);
      map.off("mouseleave", "lens-mini-price", handlePointLeave);
      map.off("click", "lens-mini-price", handlePointClick);
      resizeObserver.disconnect();
      sourceReadyRef.current = false;
      lastFocusedIdRef.current = null;
      pendingBoundsRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [applyFocusedState]);

  if (!tokenRef.current) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-muted text-xs text-text-secondary">
        Mapbox token missing
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] text-text-secondary drop-shadow-sm">
        Map data © Mapbox, © OpenStreetMap
      </div>
    </div>
  );
}
