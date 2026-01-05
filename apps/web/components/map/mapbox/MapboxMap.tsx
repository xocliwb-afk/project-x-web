'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Listing as NormalizedListing } from '@project-x/shared-types';
import mapboxgl from 'mapbox-gl';
import { buildBboxFromBounds } from './mapbox-utils';

type MapboxMapProps = {
  listings: NormalizedListing[];
  selectedListingId?: string | null;
  hoveredListingId?: string | null;
  onSelectListing?: (id: string | null) => void;
  onHoverListing?: (id: string | null) => void;
  onBoundsChange?: (bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
    bbox?: string;
  }) => void;
};

const defaultCenter: [number, number] = [42.9634, -85.6681];
const defaultZoom = 12;

export default function MapboxMap({
  listings,
  onBoundsChange,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const center: [number, number] = useMemo(() => {
    const firstWithCoords = listings.find(
      (l) => Number.isFinite(l.address.lat) && Number.isFinite(l.address.lng),
    );
    return firstWithCoords
      ? ([firstWithCoords.address.lat, firstWithCoords.address.lng] as [number, number])
      : defaultCenter;
  }, [listings]);

  useEffect(() => {
    if (!token) return;
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [center[1], center[0]],
      zoom: defaultZoom,
    });

    mapRef.current = map;

    const emitBounds = () => {
      if (!onBoundsChange) return;
      const bounds = map.getBounds() as mapboxgl.LngLatBounds;
      const bbox = buildBboxFromBounds(bounds);
      onBoundsChange(bbox);
    };

    map.on('load', emitBounds);
    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);

    return () => {
      map.off('load', emitBounds);
      map.off('moveend', emitBounds);
      map.off('zoomend', emitBounds);
      map.remove();
      mapRef.current = null;
    };
  }, [center, onBoundsChange, token]);

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-text-main/70">
        Mapbox token missing
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
