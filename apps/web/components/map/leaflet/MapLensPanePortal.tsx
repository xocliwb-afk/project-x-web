"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { MapLens } from "../MapLens";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!map) return;

    const paneName = "mapLensPane";
    const pane = map.getPane(paneName) ?? map.createPane(paneName);
    pane.style.zIndex = "1000";

    // Never allow this pane to block touches on mobile modal
    if (isMobile) {
      pane.style.pointerEvents = "none";
      return;
    }

    // Desktop: only interactive while lens is open
    pane.style.pointerEvents = activeClusterData ? "auto" : "none";

  }, [map, isMobile, activeClusterData]);

  useEffect(() => {
    if (activeClusterData) {
      openedAtRef.current = Date.now();
    }
  }, [activeClusterData]);

  useEffect(() => {
    if (!isMobile || !map) return;
    const pane = map.getPane("mapLensPane");
    const container = containerRef.current;
    if (pane && container && pane.contains(container)) {
      pane.removeChild(container);
    }
    setIsAttached(false);
  }, [isMobile, map]);

  useEffect(() => {
    if (!map || isMobile) return;

    if (!containerRef.current) {
      containerRef.current = L.DomUtil.create("div");
      Object.assign(containerRef.current.style, {
        position: "absolute",
        pointerEvents: "auto",
        zIndex: "9999",
      });
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.on(containerRef.current, "wheel", L.DomEvent.stopPropagation);
      L.DomEvent.on(containerRef.current, "touchmove", L.DomEvent.stopPropagation);
    }

    const container = containerRef.current;
    const paneName = "mapLensPane";
    const pane = map.getPane(paneName) ?? map.createPane(paneName);
    pane.style.zIndex = "1000";
    pane.style.pointerEvents = activeClusterData ? "auto" : "none";

    const updatePosition = () => {
      if (map && activeClusterData?.anchorLatLng) {
        const { lat, lng } = activeClusterData.anchorLatLng;
        const p = map.latLngToLayerPoint(L.latLng(lat, lng));
        container.style.left = `${p.x}px`;
        container.style.top = `${p.y}px`;
        container.style.transform = "translate(-50%, -50%)";
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const elapsed = Date.now() - openedAtRef.current;
      const target = event.target as HTMLElement | null;
      const isCluster = target?.closest?.("[class*='marker-cluster']");
      const inContainer = container?.contains(event.target as Node);

      console.log("🔵 [PORTAL] handlePointerDown", {
        elapsed,
        hasContainer: Boolean(container),
        targetTag: target?.tagName,
        targetClass: target?.className,
        isCluster: Boolean(isCluster),
        inContainer,
        hasActiveData: Boolean(activeClusterData),
        willDismiss: elapsed >= 250 && container && !isCluster && !inContainer && Boolean(activeClusterData)
      });

      // Don't dismiss if no lens is open
      if (!activeClusterData) return;
      if (Date.now() - openedAtRef.current < 250) return;
      if (!container) return;
      if (target?.closest?.("[class*='marker-cluster']")) return;
      if (container.contains(event.target as Node)) return;
      dismissLens();
    };

    // ALWAYS attach the pointerdown listener to prevent dismissal during cluster clicks
    map.getContainer().addEventListener("pointerdown", handlePointerDown, true);

    if (activeClusterData) {
      pane.appendChild(container);
      pane.style.pointerEvents = "auto";
      setIsAttached(true);
      map.on("move zoom", updatePosition);
      updatePosition(); // Initial position
    } else {
      setIsAttached(false);
      pane.style.pointerEvents = "none";
      if (pane.contains(container)) {
        pane.removeChild(container);
      }
    }

    // Cleanup function
    return () => {
      map.off("move zoom", updatePosition);
      map.getContainer().removeEventListener("pointerdown", handlePointerDown, true);
      setIsAttached(false);
      if (pane.contains(container)) {
        pane.removeChild(container);
      }
    };
  }, [map, activeClusterData, dismissLens, isMobile]);

  if (isMobile) {
    return null;
  }

  if (!activeClusterData || !containerRef.current || !isAttached) {
    return null;
  }

  // Render the MapLens component into the container div
  return createPortal(
    <MapLens onHoverListing={onHoverListing} onSelectListing={onSelectListing} />,
    containerRef.current
  );
}
