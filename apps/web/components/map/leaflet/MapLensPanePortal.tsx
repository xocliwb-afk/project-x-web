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
        position: "fixed",
        zIndex: "10000",
        pointerEvents: "none",
      });
      containerRef.current.dataset.testid = "map-lens-pane-portal";
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
      if (!map || !activeClusterData?.anchorLatLng || !container) return;

      const { lat, lng } = activeClusterData.anchorLatLng;

      const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
      const mapRect = map.getContainer().getBoundingClientRect();

      const viewportX = mapRect.left + pt.x;
      const viewportY = mapRect.top + pt.y;

      const rect = container.getBoundingClientRect();
      const radius = (rect.width || 525) / 2 || 262.5;

      const margin = 20;
      const minX = radius + margin;
      const maxX = window.innerWidth - radius - margin;
      const minY = radius + margin;
      const maxY = window.innerHeight - radius - margin;

      const clampedX = Math.min(maxX, Math.max(minX, viewportX));
      const clampedY = Math.min(maxY, Math.max(minY, viewportY));

      container.style.left = `${clampedX}px`;
      container.style.top = `${clampedY}px`;
      container.style.transform = "translate(-50%, -50%)";
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!activeClusterData) return;
      if (Date.now() - openedAtRef.current < 250) return;

      const target = event.target as Element | null;
      if (!target) return;

      if (target.closest?.("[class*='marker-cluster']")) return;
      if (container.contains(target)) return;

      dismissLens();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    if (activeClusterData) {
      document.body.appendChild(container);
      pane.style.pointerEvents = "auto";
      container.style.pointerEvents = "auto";
      setIsAttached(true);
      map.on("move zoom", updatePosition);
      window.addEventListener("scroll", updatePosition, { passive: true });
      window.addEventListener("resize", updatePosition);
      updatePosition(); // Initial position
      requestAnimationFrame(updatePosition);
    } else {
      setIsAttached(false);
      pane.style.pointerEvents = "none";
      container.style.pointerEvents = "none";
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }

    // Cleanup function
    return () => {
      map.off("move zoom", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      setIsAttached(false);
      pane.style.pointerEvents = "none";
      container.style.pointerEvents = "none";
      if (document.body.contains(container)) {
        document.body.removeChild(container);
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
