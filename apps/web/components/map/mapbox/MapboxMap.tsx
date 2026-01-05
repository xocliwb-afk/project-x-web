'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Listing as NormalizedListing } from '@project-x/shared-types';
import mapboxgl from 'mapbox-gl';
import { buildBboxFromBounds, listingsToGeoJSON } from './mapbox-utils';
import { MapboxLensPortal } from './MapboxLensPortal';
import { useMapLensStore } from '@/stores/useMapLensStore';
import { useMapLens } from '@/hooks/useMapLens';

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
  const clusterClickReqIdRef = useRef(0);
  const lastOpenClusterIdRef = useRef<number | null>(null);
  const inFlightClusterIdRef = useRef<number | null>(null);
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
  const { openImmediate, dismissLens } = useMapLens();

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
    let handleMapClick: ((e: mapboxgl.MapMouseEvent) => void) | null = null;

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

      const lensOpen = () => Boolean(useMapLensStore.getState().activeClusterData);

      handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
        if (lensOpen()) return;
        map.getCanvas().style.cursor = 'pointer';
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        setFeatureState(id, 'hovered', true);
        lastHoveredIdRef.current = id;
        onHoverListingRef.current?.(id);
      };

      handleMouseLeave = () => {
        if (lensOpen()) return;
        map.getCanvas().style.cursor = '';
        if (lastHoveredIdRef.current) {
          setFeatureState(lastHoveredIdRef.current, 'hovered', false);
          lastHoveredIdRef.current = null;
        }
        onHoverListingRef.current?.(null);
      };

      handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
        if (lensOpen()) return;
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        onSelectListingRef.current?.(id);
      };

      map.on('mouseenter', 'unclustered-point', handleMouseEnter);
      map.on('mouseleave', 'unclustered-point', handleMouseLeave);
      map.on('click', 'unclustered-point', handleClick);

      handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        const { activeClusterData, isLocked } = useMapLensStore.getState();
        const lensIsOpen = Boolean(activeClusterData);
        if (lensIsOpen && isLocked) return;

        const hits = map.queryRenderedFeatures(e.point, {
          layers: ['cluster-count', 'clusters', 'unclustered-point'],
        });

        const clusterFeature = hits.find(
          (f) => f.layer?.id === 'cluster-count' || f.layer?.id === 'clusters',
        );

        if (clusterFeature) {
          const clusterId = clusterFeature.properties?.cluster_id as number | undefined;
          const pointCount = clusterFeature.properties?.point_count as number | undefined;
          const coords =
            clusterFeature?.geometry && 'coordinates' in clusterFeature.geometry
              ? (clusterFeature.geometry as any).coordinates
              : null;
          if (!Array.isArray(coords) || coords.length < 2) return;
          const [lng, lat] = coords as [number, number];
          if (clusterId == null || lng == null || lat == null) return;

          if (process.env.NODE_ENV === 'development') {
            console.log('[MB CLUSTER CLICK]', 'stage=received', {
              hasLens: lensIsOpen,
              lastOpenClusterId: lastOpenClusterIdRef.current,
              clusterId,
              pointCount,
              point: e.point,
            });
          }

          if (lensIsOpen && lastOpenClusterIdRef.current === clusterId) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[MB CLUSTER CLICK]', 'stage=toggle-close', { clusterId });
            }
            clusterClickReqIdRef.current += 1;
            lastOpenClusterIdRef.current = null;
            inFlightClusterIdRef.current = null;
            dismissLens();
            return;
          }

          if (!lensIsOpen && inFlightClusterIdRef.current === clusterId) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[MB CLUSTER CLICK]', 'stage=inflight-ignore', { clusterId });
            }
            return;
          }
          if (!lensIsOpen) {
            inFlightClusterIdRef.current = clusterId;
          }

          const clusterKey = `mb:${clusterId}`;
          const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
          if (!source || typeof source.getClusterLeaves !== 'function') return;

          const reqId = ++clusterClickReqIdRef.current;
          const limit = Math.min(typeof pointCount === 'number' ? pointCount : 500, 500);
          const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
          source.getClusterLeaves(clusterId, limit, 0, (err, leaves) => {
            if (inFlightClusterIdRef.current === clusterId) {
              inFlightClusterIdRef.current = null;
              if (process.env.NODE_ENV === 'development') {
                console.log('[MB CLUSTER CLICK]', 'stage=inflight-clear', { clusterId });
              }
            }
            if (reqId !== clusterClickReqIdRef.current) return;
            if (err || !leaves) {
              console.warn('[MapboxMap] getClusterLeaves failed', err);
              return;
            }
            const byId = new Map(listingsRef.current.map((l) => [String(l.id), l]));
            const leafListings = leaves
              .map((leaf) => {
                const id = leaf?.properties?.id;
                return id != null ? byId.get(String(id)) : undefined;
              })
              .filter(Boolean) as NormalizedListing[];
            if (process.env.NODE_ENV === 'development') {
              const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
              console.log('[MB CLUSTER CLICK]', 'stage=leaves', {
                elapsedMs: Math.round(t1 - t0),
                leaves: leaves?.length ?? 0,
                listings: leafListings.length,
                clusterId,
              });
            }
            if (!leafListings.length) return;
            lastOpenClusterIdRef.current = clusterId;
            openImmediate(leafListings, { lat, lng }, { clusterKey });
          });
          return;
        }

        if (lensIsOpen && hits.length === 0 && !isLocked) {
          lastOpenClusterIdRef.current = null;
          inFlightClusterIdRef.current = null;
          dismissLens();
        }
      };

      map.on('click', handleMapClick);

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
      if (handleMapClick) {
        map.off('click', handleMapClick);
      }
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      sourceReadyRef.current = false;
    };
  }, [token, applyFeatureStates, setFeatureState, openImmediate, dismissLens]);

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
