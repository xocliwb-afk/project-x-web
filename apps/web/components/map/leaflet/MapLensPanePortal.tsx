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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!map) return;

    if (!containerRef.current) {
      containerRef.current = L.DomUtil.create("div");
      Object.assign(containerRef.current.style, {
        position: "absolute",
        pointerEvents: "auto",
        zIndex: "9999",
      });
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
      setReady(true);
    }

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
      overlayPane.appendChild(container);
      map.on("move zoom", updatePosition);
      map.on("click", dismissLens);
      updatePosition();
    } else {
      if (overlayPane.contains(container)) {
        overlayPane.removeChild(container);
      }
    }

    return () => {
      map.off("move zoom", updatePosition);
      map.off("click", dismissLens);
      if (overlayPane.contains(container)) {
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
