'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Listing as NormalizedListing } from '@project-x/shared-types';
import mapboxgl from 'mapbox-gl';
import { buildBboxFromBounds, listingsToGeoJSON } from './mapbox-utils';
import { MapboxLensPortal } from './MapboxLensPortal';
import { useMapLensStore } from '@/stores/useMapLensStore';
import { useMapLens } from '@/hooks/useMapLens';
import ListingPreviewModal from '../ListingPreviewModal';
import { getThumbnailUrl } from '@/lib/listingFormat';
import { useIsMobile } from '@/hooks/useIsMobile';
import { trackEvent } from '@/lib/analytics';
import type { LatLngBoundsTuple } from '@/components/map/types';

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
const OVERLAP_HITBOX_PX = 14;
const OVERLAP_MIN_COUNT = 2;
const OVERLAP_MAX_LENS = 50;

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
  const hoverPointRef = useRef<{ point: { x: number; y: number }; featureId?: string } | null>(null);
  const hoverRafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [previewListing, setPreviewListing] = useState<NormalizedListing | null>(null);
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
  const isMobile = useIsMobile();

  const escapeHtml = useCallback((input: unknown) => {
    const str = String(input ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }, []);

  const safeUrl = useCallback((input: unknown) => {
    const str = String(input ?? '').trim();
    if (!str) return '';
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    return '';
  }, []);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onHoverListingRef.current = onHoverListing;
  }, [onHoverListing]);

  useEffect(() => {
    onSelectListingRef.current = onSelectListing;
  }, [onSelectListing]);

  const getNearbyListingIds = useCallback(
    (point: { x: number; y: number }) => {
      const map = mapRef.current;
      if (!map || !sourceReadyRef.current) return [];
      const bbox: [[number, number], [number, number]] = [
        [point.x - OVERLAP_HITBOX_PX, point.y - OVERLAP_HITBOX_PX],
        [point.x + OVERLAP_HITBOX_PX, point.y + OVERLAP_HITBOX_PX],
      ];
      const features = map.queryRenderedFeatures(bbox, {
        layers: ['unclustered-price', 'unclustered-point'],
      });
      const ids = new Set<string>();
      features.forEach((f) => {
        const props = (f.properties ?? {}) as Record<string, unknown>;
        const id = props.id ?? props.mlsId;
        if (id != null) {
          ids.add(String(id));
        }
      });
      return Array.from(ids);
    },
    [],
  );

  const mapIdsToListings = useCallback((ids: string[]) => {
    const byId = new Map<string, NormalizedListing>();
    listingsRef.current.forEach((l) => {
      if (l.id != null) byId.set(String(l.id), l);
      if (l.mlsId != null) byId.set(String(l.mlsId), l);
    });
    const results: NormalizedListing[] = [];
    ids.forEach((id) => {
      const listing = byId.get(id);
      if (listing && !results.includes(listing)) {
        results.push(listing);
      }
    });
    return results.slice(0, OVERLAP_MAX_LENS);
  }, []);

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
    const canvas = map.getCanvas();
    canvas.style.cursor = 'grab';

    const handleMouseDown = () => {
      isDraggingRef.current = true;
      canvas.style.cursor = 'grabbing';
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
    };

    map.on('mousedown', handleMouseDown);
    map.on('mouseup', handleMouseUp);
    map.on('dragend', handleMouseUp);

    const emitBounds = () => {
      if (!onBoundsChangeRef.current) return;
      const bounds = map.getBounds() as mapboxgl.LngLatBounds;
      const bbox = buildBboxFromBounds(bounds);
      onBoundsChangeRef.current?.(bbox);
    };

    const sourceId = 'listings';

    let handleMouseEnter: ((e: mapboxgl.MapLayerMouseEvent) => void) | null = null;
    let handleMouseMove: ((e: mapboxgl.MapLayerMouseEvent) => void) | null = null;
    let handleMouseLeave: ((e: mapboxgl.MapLayerMouseEvent) => void) | null = null;
    let handleClick: ((e: mapboxgl.MapLayerMouseEvent) => void) | null = null;
    let handleMapClick: ((e: mapboxgl.MapMouseEvent) => void) | null = null;

    map.on('load', () => {
      const pillId = 'price-pill';
      if (map.hasImage(pillId) === false) {
        const width = 80;
        const height = 36;
        const radius = 18;
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
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
          try {
            map.addImage(pillId, ctx.getImageData(0, 0, canvas.width, canvas.height), {
              pixelRatio: 2,
            });
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[MapboxMap] Failed to add price-pill image:', err);
            }
          }
        }
      }

      if (!map.getSource(sourceId)) {
        try {
          map.addSource(sourceId, {
            type: 'geojson',
            data: listingsToGeoJSON(listingsRef.current),
            cluster: false,
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MapboxMap] Failed to add source:', err);
          }
        }
      }

      if (!map.getLayer('unclustered-point')) {
        try {
          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: sourceId,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#2563eb',
              'circle-radius': 12,
              'circle-opacity': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                0.25,
                ['boolean', ['feature-state', 'hovered'], false],
                0.15,
                0.0,
              ],
              'circle-stroke-width': 0,
            },
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MapboxMap] Failed to add unclustered-point layer:', err);
          }
        }
      }

      if (!map.getLayer('unclustered-price')) {
        try {
          map.addLayer({
            id: 'unclustered-price',
            type: 'symbol',
            source: sourceId,
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': ['get', 'priceLabel'],
              'text-size': 14,
              'icon-image': 'price-pill',
              'icon-text-fit': 'both',
              'icon-text-fit-padding': [6, 10, 6, 10],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-anchor': 'center',
              'text-font': ['DIN Offc Pro Bold', 'DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'text-anchor': 'center',
              'text-offset': [0, 0],
              'text-padding': 2,
            },
            paint: {
              'text-color': '#0f172a',
              'text-halo-color': '#0f172a',
              'text-halo-width': 0,
            },
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MapboxMap] Failed to add unclustered-price layer:', err);
          }
        }
      }

      const lensOpen = () => Boolean(useMapLensStore.getState().activeClusterData);

      const runHoverCheck = (point: { x: number; y: number }, featureId?: string) => {
        if (lensOpen()) return;
        const nearbyIds = getNearbyListingIds(point);
        const isCrowded = nearbyIds.length >= OVERLAP_MIN_COUNT;
        canvas.style.cursor = isCrowded ? 'zoom-in' : 'pointer';
        if (!featureId) return;
        setFeatureState(featureId, 'hovered', true);
        lastHoveredIdRef.current = featureId;
        onHoverListingRef.current?.(featureId);
      };

      handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
        hoverPointRef.current = {
          point: e.point,
          featureId: e.features?.[0]?.properties?.id as string | undefined,
        };
        runHoverCheck(hoverPointRef.current.point, hoverPointRef.current.featureId);
      };

      handleMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
        hoverPointRef.current = {
          point: e.point,
          featureId: e.features?.[0]?.properties?.id as string | undefined,
        };
        if (hoverRafRef.current != null) return;
        hoverRafRef.current = window.requestAnimationFrame(() => {
          hoverRafRef.current = null;
          const latestHover = hoverPointRef.current;
          if (!latestHover) return;
          runHoverCheck(latestHover.point, latestHover.featureId);
        });
      };

      handleMouseLeave = () => {
        if (hoverRafRef.current != null) {
          cancelAnimationFrame(hoverRafRef.current);
          hoverRafRef.current = null;
        }
        hoverPointRef.current = null;
        if (lensOpen()) return;
        canvas.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        if (lastHoveredIdRef.current) {
          setFeatureState(lastHoveredIdRef.current, 'hovered', false);
          lastHoveredIdRef.current = null;
        }
        onHoverListingRef.current?.(null);
      };

      handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
        if (lensOpen()) return;
        const feature = e.features?.[0];
        const id = feature?.properties?.id as string | undefined;
        if (!id) return;
        const listing = listingsRef.current.find((l) => String(l.id) === id);
        if (!listing) return;

        trackEvent('listing_click', {
          listing_id: listing.id ?? listing.mlsId ?? id,
          source: 'pin',
          page_type: 'search',
        });

        const coords =
          feature?.geometry && 'coordinates' in feature.geometry
            ? (feature.geometry as any).coordinates
            : null;

        if (isMobile) {
          setPreviewListing(listing);
          return;
        }

        onSelectListingRef.current?.(id);

        if (!Array.isArray(coords) || coords.length < 2) return;
        const [lng, lat] = coords as [number, number];

        const priceNumber = typeof listing.listPrice === 'number' ? listing.listPrice : 0;
        const priceLabel =
          typeof listing.listPriceFormatted === 'string' && listing.listPriceFormatted.length > 0
            ? listing.listPriceFormatted
            : priceNumber > 0
              ? `$${priceNumber.toLocaleString()}`
              : '$0';
        const beds = listing.details?.beds ?? 0;
        const baths = listing.details?.baths ?? 0;
        const sqft = listing.details?.sqft ?? null;
        const fullAddress = listing.address?.full ?? 'Address unavailable';
        const cityLine = `${listing.address.city}, ${listing.address.state} ${listing.address.zip}`.trim();
        const thumbUrl = safeUrl(getThumbnailUrl(listing));
        const escapedFullAddress = escapeHtml(fullAddress);
        const escapedCityLine = escapeHtml(cityLine);
        const escapedPrice = escapeHtml(priceLabel);
        const escapedBedsBathsSqft = escapeHtml(
          `${beds} bds • ${baths} ba • ${typeof sqft === 'number' && sqft > 0 ? sqft.toLocaleString() : '—'} sqft`,
        );

        const htmlThumb = thumbUrl
          ? `<img src="${thumbUrl}" alt="${escapedFullAddress}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" />`
          : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:11px; background:#e5e7eb;">No photo</div>`;

        const html = `
          <div style="max-width: 240px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a;">
            <div style="display:flex; gap:10px;">
              <div style="flex-shrink:0; width:96px; height:72px; border-radius:8px; overflow:hidden; background:#e5e7eb;">
                ${htmlThumb}
              </div>
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; font-size:14px; margin-bottom:2px;">${escapedPrice}</div>
                <div style="font-size:12px; color:#475569; line-height:1.3;">${escapedFullAddress}</div>
                <div style="font-size:11px; color:#64748b;">${escapedCityLine}</div>
                <div style="font-size:11px; color:#475569; margin-top:4px;">${escapedBedsBathsSqft}</div>
              </div>
            </div>
            <div style="margin-top:8px;">
              <a href="/listing/${listing.id}" style="font-size:12px; font-weight:600; color:#2563eb; text-decoration:none;">View Details →</a>
            </div>
          </div>
        `;

        if (!popupRef.current) {
          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '280px',
            className: 'mapbox-listing-popup',
          });
        }
        popupRef.current.setLngLat([lng, lat]).setHTML(html).addTo(map);
      };

      map.on('mouseenter', 'unclustered-point', handleMouseEnter);
      map.on('mouseleave', 'unclustered-point', handleMouseLeave);
      map.on('click', 'unclustered-point', handleClick);
      map.on('mouseenter', 'unclustered-price', handleMouseEnter);
      map.on('mousemove', 'unclustered-price', handleMouseMove);
      map.on('mouseleave', 'unclustered-price', handleMouseLeave);
      map.on('click', 'unclustered-price', handleClick);

      handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        const { activeClusterData, isLocked } = useMapLensStore.getState();
        const lensIsOpen = Boolean(activeClusterData);
        if (lensIsOpen && isLocked) return;

        const nearbyIds = getNearbyListingIds(e.point);
        const isCrowded = nearbyIds.length >= OVERLAP_MIN_COUNT;
        if (isCrowded) {
          const baseListings = mapIdsToListings(nearbyIds);
          if (baseListings.length === 0) {
            dismissLens();
            return;
          }

          const { lng, lat } = e.lngLat;
          const overlapKey = `ov:${[...nearbyIds].sort().slice(0, 5).join('|')}:${baseListings.length}`;
          const activeClusterKey = useMapLensStore.getState().activeClusterData?.clusterKey;
          if (lensIsOpen && activeClusterKey === overlapKey && !isLocked) {
            dismissLens();
            return;
          }
          if (popupRef.current) {
            popupRef.current.remove();
          }
          setPreviewListing(null);

          const coords = baseListings
            .map((l) => ({
              lat: Number(l.address?.lat),
              lng: Number(l.address?.lng),
              listing: l,
            }))
            .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

          if (coords.length === 0) {
            openImmediate(baseListings, { lat, lng }, { clusterKey: overlapKey });
            return;
          }

          const south = Math.min(...coords.map((c) => c.lat));
          const north = Math.max(...coords.map((c) => c.lat));
          const west = Math.min(...coords.map((c) => c.lng));
          const east = Math.max(...coords.map((c) => c.lng));
          const latSpan = north - south;
          const lngSpan = east - west;
          const latPad = Math.max(latSpan * 0.12, 0.0005);
          const lngPad = Math.max(lngSpan * 0.12, 0.0005);
          const expanded: LatLngBoundsTuple = [
            [Math.max(-85, south - latPad), Math.max(-180, west - lngPad)],
            [Math.min(85, north + latPad), Math.min(180, east + lngPad)],
          ];

          const allListings = listingsRef.current;
          const dedupe = new Set<string>();
          const expandedListings: NormalizedListing[] = [];
          allListings.forEach((listing) => {
            const id = String(listing.id ?? listing.mlsId ?? '');
            if (!id || dedupe.has(id)) return;
            const latVal = Number(listing.address?.lat);
            const lngVal = Number(listing.address?.lng);
            if (!Number.isFinite(latVal) || !Number.isFinite(lngVal)) return;
            const inLat = latVal >= expanded[0][0] && latVal <= expanded[1][0];
            const inLng = lngVal >= expanded[0][1] && lngVal <= expanded[1][1];
            if (inLat && inLng) {
              dedupe.add(id);
              expandedListings.push(listing);
            }
          });

          const finalListings =
            expandedListings.length >= baseListings.length ? expandedListings : baseListings;

          openImmediate(finalListings, { lat, lng }, { clusterKey: overlapKey });
          return;
        }

        const hits = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point', 'unclustered-price'],
        });

        if (hits.length === 0) {
          if (popupRef.current) {
            popupRef.current.remove();
          }
          if (!lensIsOpen) {
            setPreviewListing(null);
          }
        }

        if (lensIsOpen && hits.length === 0 && !isLocked) {
          setPreviewListing(null);
          if (popupRef.current) {
            popupRef.current.remove();
          }
          dismissLens();
        }
      };

      map.on('click', handleMapClick);
      map.on('dragstart', () => {
        isDraggingRef.current = true;
        canvas.style.cursor = 'grabbing';
      });
      map.on('dragend', () => {
        isDraggingRef.current = false;
        canvas.style.cursor = 'grab';
      });
      map.on('drag', () => {
        if (isDraggingRef.current) {
          canvas.style.cursor = 'grabbing';
        }
      });
      map.on('mouseout', () => {
        isDraggingRef.current = false;
        canvas.style.cursor = 'grab';
      });

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
        map.off('mouseenter', 'unclustered-price', handleMouseEnter);
      }
      if (handleMouseMove) {
        map.off('mousemove', 'unclustered-price', handleMouseMove);
      }
      if (handleMouseLeave) {
        map.off('mouseleave', 'unclustered-point', handleMouseLeave);
        map.off('mouseleave', 'unclustered-price', handleMouseLeave);
      }
      if (handleClick) {
        map.off('click', 'unclustered-point', handleClick);
        map.off('click', 'unclustered-price', handleClick);
      }
      if (handleMapClick) {
        map.off('click', handleMapClick);
      }
      map.off('mousedown', handleMouseDown);
      map.off('mouseup', handleMouseUp);
      map.off('dragend', handleMouseUp);
      if (hoverRafRef.current != null) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = null;
      }
      hoverPointRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      sourceReadyRef.current = false;
    };
  }, [
    token,
    applyFeatureStates,
    setFeatureState,
    openImmediate,
    dismissLens,
    isMobile,
    escapeHtml,
    safeUrl,
    getNearbyListingIds,
    mapIdsToListings,
  ]);

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
      <ListingPreviewModal
        listing={previewListing}
        isOpen={Boolean(previewListing)}
        onClose={() => setPreviewListing(null)}
      />
    </>
  );
}
