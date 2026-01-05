'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { useMapLensStore } from '@/stores/useMapLensStore';
import { MapLens } from '../MapLens';
import { useIsMobile } from '@/hooks/useIsMobile';

type MapboxLensPortalProps = {
  map: mapboxgl.Map | null;
  onHoverListing?: (id: string | null) => void;
  onSelectListing?: (id: string | null) => void;
};

export function MapboxLensPortal({ map, onHoverListing, onSelectListing }: MapboxLensPortalProps) {
  const { activeClusterData, dismissLens, isLocked } = useMapLensStore((s) => ({
    activeClusterData: s.activeClusterData,
    dismissLens: s.dismissLens,
    isLocked: s.isLocked,
  }));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const ensureContainer = useCallback(() => {
    if (containerRef.current) return containerRef.current;
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '10000',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
    });
    el.dataset.testid = 'mapbox-lens-portal';
    containerRef.current = el;
    return el;
  }, []);

  const updatePosition = useCallback(() => {
    const mapInstance = map;
    const container = containerRef.current;
    if (!mapInstance || !container || !activeClusterData?.anchorLatLng) return;
    const { lat, lng } = activeClusterData.anchorLatLng;
    const point = mapInstance.project([lng, lat]);
    const rect = mapInstance.getContainer().getBoundingClientRect();
    container.style.left = `${rect.left + point.x}px`;
    container.style.top = `${rect.top + point.y}px`;
  }, [map, activeClusterData]);

  useEffect(() => {
    const mapInstance = map;
    if (!mapInstance || !activeClusterData || isMobile) {
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current);
      }
      return;
    }

    const container = ensureContainer();
    if (!document.body.contains(container)) {
      document.body.appendChild(container);
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isLocked) return;
      const target = event.target as Element | null;
      if (!target) return;
      if (container.contains(target)) return;
      dismissLens();
    };

    mapInstance.on('move', updatePosition);
    mapInstance.on('zoom', updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, true);

    updatePosition();
    requestAnimationFrame(updatePosition);

    return () => {
      mapInstance.off('move', updatePosition);
      mapInstance.off('zoom', updatePosition);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current);
      }
    };
  }, [map, activeClusterData, ensureContainer, updatePosition, dismissLens, isLocked, isMobile]);

  if (isMobile) return null;
  const container = activeClusterData ? ensureContainer() : null;
  if (!activeClusterData || !container) return null;

  return createPortal(
    <div className="pointer-events-auto">
      <MapLens onHoverListing={onHoverListing} onSelectListing={onSelectListing} />
    </div>,
    container,
  );
}
