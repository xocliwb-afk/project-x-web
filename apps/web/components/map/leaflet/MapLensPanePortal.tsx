"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { MapLens } from "../MapLens";

interface MapLensPanePortalProps {
  map: L.Map | null;
  onHoverListing?: (id: string | null) => void;
  onSelectListing?: (id: string | null) => void;
}

export function MapLensPanePortal({
  map,
  onHoverListing,
  onSelectListing,
}: MapLensPanePortalProps) {
  const { activeClusterData, dismissLens } = useMapLensStore((s) => ({
    activeClusterData: s.activeClusterData,
    dismissLens: s.dismissLens,
  }));

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!map) return;

    let isInitialized = false;
    // Create DOM elements if they don't exist
    if (!backdropRef.current) {
      backdropRef.current = L.DomUtil.create("div");
      Object.assign(backdropRef.current.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        background: "transparent",
        zIndex: "9998",
      });
      L.DomEvent.on(backdropRef.current, "click", dismissLens);
      isInitialized = true;
    }
    if (!containerRef.current) {
      containerRef.current = L.DomUtil.create("div");
      Object.assign(containerRef.current.style, {
        position: "absolute",
        pointerEvents: "auto",
        zIndex: "9999",
      });
      // Stop clicks from propagating to the backdrop/map
      L.DomEvent.on(
        containerRef.current,
        "click dblclick mousedown mouseup",
        L.DomEvent.stopPropagation
      );
      isInitialized = true;
    }

    if (isInitialized) {
      setReady(true);
    }

    const backdrop = backdropRef.current;
    const container = containerRef.current;
    const overlayPane = map.getPanes().overlayPane;

    const updatePosition = () => {
      if (map && activeClusterData?.anchorLatLng) {
        const { lat, lng } = activeClusterData.anchorLatLng;
        const p = map.latLngToLayerPoint(L.latLng(lat, lng));
        container.style.left = `${p.x}px`;
        container.style.top = `${p.y}px`;
        container.style.transform = "translate(-50%, -50%)";
      }
    };

    if (activeClusterData) {
      overlayPane.appendChild(backdrop);
      overlayPane.appendChild(container);

      map.on("move zoom", updatePosition);
      updatePosition(); // Initial position
    }

    // Cleanup function
    return () => {
      map.off("move zoom", updatePosition);
      if (backdrop && overlayPane.contains(backdrop)) {
        overlayPane.removeChild(backdrop);
      }
      if (container && overlayPane.contains(container)) {
        overlayPane.removeChild(container);
      }
    };
  }, [map, activeClusterData, dismissLens]);

  if (!ready || !activeClusterData || !containerRef.current) {
    return null;
  }

  // Render the MapLens component into the container div
  return createPortal(
    <MapLens onHoverListing={onHoverListing} onSelectListing={onSelectListing} />,
    containerRef.current
  );
}
