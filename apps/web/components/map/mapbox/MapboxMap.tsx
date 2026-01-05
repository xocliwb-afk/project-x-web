'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Listing as NormalizedListing } from '@project-x/shared-types';
import mapboxgl from 'mapbox-gl';
import { buildBboxFromBounds, listingsToGeoJSON } from './mapbox-utils';
import { MapboxLensPortal } from './MapboxLensPortal';

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
  selectedListingId,
  hoveredListingId,
  onSelectListing,
  onHoverListing,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const sourceReadyRef = useRef(false);
  const lastSelectedIdRef = useRef<string | null>(null);
  const lastHoveredIdRef = useRef<string | null>(null);
  const listingsRef = useRef(listings);
  const resolveInitialCenter = () => {
    const firstWithCoords = listings.find(
      (l) => Number.isFinite(l.address.lat) && Number.isFinite(l.address.lng),
    );
    return firstWithCoords
      ? ([firstWithCoords.address.lat, firstWithCoords.address.lng] as [number, number])
      : defaultCenter;
  };
  const initialCenterRef = useRef<[number, number]>(resolveInitialCenter());
  const initialZoomRef = useRef<number>(defaultZoom);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onHoverListingRef = useRef(onHoverListing);
  const onSelectListingRef = useRef(onSelectListing);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onHoverListingRef.current = onHoverListing;
  }, [onHoverListing]);

  useEffect(() => {
    onSelectListingRef.current = onSelectListing;
  }, [onSelectListing]);

  const setFeatureState = useCallback((id: string, key: 'selected' | 'hovered', value: boolean) => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) return;
    const source = map.getSource('listings');
    if (!source) return;
    try {
      map.setFeatureState({ source: 'listings', id }, { [key]: value });
    } catch {
      /* noop */
    }
  }, []);

  const applyFeatureStates = useCallback(() => {
    if (lastSelectedIdRef.current) {
      setFeatureState(lastSelectedIdRef.current, 'selected', true);
    }
    if (lastHoveredIdRef.current) {
      setFeatureState(lastHoveredIdRef.current, 'hovered', true);
    }
  }, [setFeatureState]);

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    if (!token) return;
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [initialCenterRef.current[1], initialCenterRef.current[0]],
      zoom: initialZoomRef.current,
    });

    mapRef.current = map;
    setMapInstance(map);

    const emitBounds = () => {
      if (!onBoundsChangeRef.current) return;
      const bounds = map.getBounds() as mapboxgl.LngLatBounds;
      const bbox = buildBboxFromBounds(bounds);
      onBoundsChangeRef.current?.(bbox);
    };

    const sourceId = 'listings';

    let handleMouseEnter: ((e: mapboxgl.MapLayerMouseEvent) => void) | null = null;
    let handleMouseLeave: (() => void) | null = null;
    let handleClick: ((e: mapboxgl.MapLayerMouseEvent) => void) | null = null;

    map.on('load', () => {
      map.addSource(sourceId, {
        type: 'geojson',
        data: listingsToGeoJSON(listingsRef.current),
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#93c5fd',
            10,
            '#60a5fa',
            25,
            '#3b82f6',
            50,
            '#1d4ed8',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            14,
            10,
            18,
            25,
            22,
            50,
            28,
          ],
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#0f172a',
        },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#1d4ed8',
            ['boolean', ['feature-state', 'hovered'], false],
            '#38bdf8',
            '#0ea5e9',
          ],
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            9,
            ['boolean', ['feature-state', 'hovered'], false],
            8,
            6,
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0f172a',
        },
      });

      handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        setFeatureState(id, 'hovered', true);
        lastHoveredIdRef.current = id;
        onHoverListingRef.current?.(id);
      };

      handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
        if (lastHoveredIdRef.current) {
          setFeatureState(lastHoveredIdRef.current, 'hovered', false);
          lastHoveredIdRef.current = null;
        }
        onHoverListingRef.current?.(null);
      };

      handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        onSelectListingRef.current?.(id);
      };

      map.on('mouseenter', 'unclustered-point', handleMouseEnter);
      map.on('mouseleave', 'unclustered-point', handleMouseLeave);
      map.on('click', 'unclustered-point', handleClick);

      sourceReadyRef.current = true;
      emitBounds();
      applyFeatureStates();
    });

    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);

    return () => {
      map.off('load', emitBounds);
      map.off('moveend', emitBounds);
      map.off('zoomend', emitBounds);
      if (handleMouseEnter) {
        map.off('mouseenter', 'unclustered-point', handleMouseEnter);
      }
      if (handleMouseLeave) {
        map.off('mouseleave', 'unclustered-point', handleMouseLeave);
      }
      if (handleClick) {
        map.off('click', 'unclustered-point', handleClick);
      }
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      sourceReadyRef.current = false;
    };
  }, [token, applyFeatureStates, setFeatureState]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) return;
    const source = map.getSource('listings') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(listingsToGeoJSON(listings));
    applyFeatureStates();
  }, [listings, applyFeatureStates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) return;
    if (lastSelectedIdRef.current && lastSelectedIdRef.current !== selectedListingId) {
      setFeatureState(lastSelectedIdRef.current, 'selected', false);
      lastSelectedIdRef.current = null;
    }
    if (selectedListingId) {
      setFeatureState(selectedListingId, 'selected', true);
      lastSelectedIdRef.current = selectedListingId;
    }
  }, [selectedListingId, setFeatureState]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) return;
    if (lastHoveredIdRef.current && lastHoveredIdRef.current !== hoveredListingId) {
      setFeatureState(lastHoveredIdRef.current, 'hovered', false);
      lastHoveredIdRef.current = null;
    }
    if (hoveredListingId) {
      setFeatureState(hoveredListingId, 'hovered', true);
      lastHoveredIdRef.current = hoveredListingId;
    }
  }, [hoveredListingId, setFeatureState]);

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-text-main/70">
        Mapbox token missing
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      <MapboxLensPortal
        map={mapInstance}
        onHoverListing={onHoverListing}
        onSelectListing={onSelectListing}
      />
    </>
  );
}
