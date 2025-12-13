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
  const openedAtRef = useRef<number>(0);
  const [isAttached, setIsAttached] = useState(false);

  useEffect(() => {
    if (activeClusterData) {
      openedAtRef.current = Date.now();
    }
  }, [activeClusterData]);

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
    }

    const container = containerRef.current;
    const paneName = "mapLensPane";
    const pane = map.getPane(paneName) ?? map.createPane(paneName);
    pane.style.zIndex = "1000";
    pane.style.pointerEvents = "auto";

    const updatePosition = () => {
      if (map && activeClusterData?.anchorLatLng) {
        const { lat, lng } = activeClusterData.anchorLatLng;
        const p = map.latLngToLayerPoint(L.latLng(lat, lng));
        container.style.left = `${p.x}px`;
        container.style.top = `${p.y}px`;
        container.style.transform = "translate(-50%, -50%)";
      }
    };

    const handleMapClick = () => {
      if (Date.now() - openedAtRef.current < 250) return;
      dismissLens();
    };

    if (activeClusterData) {
      pane.appendChild(container);
      setIsAttached(true);
      map.on("move zoom", updatePosition);
      map.on("click", handleMapClick);
      updatePosition(); // Initial position
    } else {
      setIsAttached(false);
      if (pane.contains(container)) {
        pane.removeChild(container);
      }
    }

    // Cleanup function
    return () => {
      map.off("move zoom", updatePosition);
      map.off("click", handleMapClick);
      setIsAttached(false);
      if (pane.contains(container)) {
        pane.removeChild(container);
      }
    };
  }, [map, activeClusterData, dismissLens]);

  if (!activeClusterData || !containerRef.current || !isAttached) {
    return null;
  }

  // Render the MapLens component into the container div
  return createPortal(
    <MapLens onHoverListing={onHoverListing} onSelectListing={onSelectListing} />,
    containerRef.current
  );
}
