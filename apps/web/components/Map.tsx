"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  createLayerComponent,
  type LayerProps,
  type LeafletContextInterface,
} from "@react-leaflet/core";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Listing as NormalizedListing } from "@project-x/shared-types";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { createClusterIcon } from "./map/MapClusterMarker";
import { MapLensPanePortal } from "./map/leaflet/MapLensPanePortal";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { useMapLens } from "@/hooks/useMapLens";
import type {
  LayerGroup,
  LatLngBoundsLiteral,
  LeafletEvent,
  LeafletMouseEvent,
  Map as LeafletMap,
} from "leaflet";
import { MapLens } from "./map/MapLens";
import { useIsMobile } from "@/hooks/useIsMobile";
import ListingPreviewModal from "./map/ListingPreviewModal";
import { getThumbnailUrl } from "@/lib/listingFormat";

const iconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SelectedIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [41, 41],
});

type MarkerClusterGroupProps = PropsWithChildren<
  L.MarkerClusterGroupOptions & LayerProps
>;

const MarkerClusterGroup = createLayerComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  (props: MarkerClusterGroupProps, context: LeafletContextInterface) => {
    const { children: _c, eventHandlers: _eh, ...options } = props;
    const clusterGroup = L.markerClusterGroup(options);
    return {
      instance: clusterGroup,
      context: { ...context, layerContainer: clusterGroup },
    };
  },
);

interface MapProps {
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
}

export default function Map({
  listings,
  selectedListingId,
  hoveredListingId,
  onSelectListing,
  onHoverListing,
  onBoundsChange,
}: MapProps) {
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<LayerGroup | null>(null);
  const [clusterLayer, setClusterLayer] = useState<LayerGroup | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [previewListing, setPreviewListing] = useState<NormalizedListing | null>(null);
  const dismissLens = useMapLensStore((s) => s.dismissLens);
  const lensOpen = useMapLensStore((s) => Boolean(s.activeClusterData));
  const router = useRouter();
  const { openImmediate } = useMapLens();
  const activeClusterData = useMapLensStore((s) => s.activeClusterData);
  const isMobile = useIsMobile();
  const overlayOpen = lensOpen || Boolean(previewListing);
  const clusterClickHandlerRef = useRef<(e: any) => void>(() => {});
  const defaultCenter: [number, number] = [42.9634, -85.6681];

  const firstWithCoords = listings.find(
    (l) => Number.isFinite(l.address.lat) && Number.isFinite(l.address.lng),
  );

  const center: [number, number] = firstWithCoords
    ? ([firstWithCoords.address.lat, firstWithCoords.address.lng] as [number, number])
    : defaultCenter;
  useEffect(() => {
    setMounted(true);
  }, []);
  const getClusterListings = useCallback(
    (cluster: L.MarkerCluster): NormalizedListing[] =>
      cluster
        .getAllChildMarkers()
        .map((m: any) => m.options?.listingData as NormalizedListing)
        .filter(Boolean),
    [],
  );

  const toBoundsLiteral = useCallback((bounds: L.LatLngBounds): LatLngBoundsLiteral => {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return [
      [sw.lat, sw.lng],
      [ne.lat, ne.lng],
    ];
  }, []);

  const buildClusterKey = useCallback(
    (listingsForCluster: NormalizedListing[]) =>
      listingsForCluster
        .map((listing) => listing.id)
        .filter(Boolean)
        .sort()
        .join("|"),
    [],
  );

  const handleClusterClick = useCallback(
    (e: any) => {
      const cluster = e.layer as L.MarkerCluster;
      const listingsForCluster = getClusterListings(cluster);
      if (!listingsForCluster.length) return;

      const latLng = cluster.getLatLng();
      const pos = { lat: latLng.lat, lng: latLng.lng };
      const boundsLiteral = toBoundsLiteral(cluster.getBounds());
      const clusterKey = buildClusterKey(listingsForCluster);

      const isSameCluster =
        Boolean(activeClusterData?.clusterKey) &&
        clusterKey.length > 0 &&
        clusterKey === activeClusterData?.clusterKey;

      if (isSameCluster) {
        dismissLens();
      } else {
        openImmediate(listingsForCluster, pos, {
          bounds: boundsLiteral,
          clusterKey,
        });
      }

      e.originalEvent?.stopPropagation?.();
      e.originalEvent?.preventDefault?.();
    },
    [
      activeClusterData?.clusterKey,
      buildClusterKey,
      dismissLens,
      getClusterListings,
      openImmediate,
      toBoundsLiteral,
    ],
  );

  useEffect(() => {
    clusterClickHandlerRef.current = handleClusterClick;
  }, [handleClusterClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapBackgroundClick = (e: LeafletMouseEvent) => {
      const { activeClusterData: currentCluster } = useMapLensStore.getState();
      if (!currentCluster) return;

      const target = (e.originalEvent?.target as HTMLElement | null) ?? null;
      const hitInteractive = target?.closest(
        ".leaflet-marker-icon, .leaflet-marker-shadow, [class*='marker-cluster']",
      );
      if (hitInteractive) return;

      dismissLens();
    };

    map.on("click", handleMapBackgroundClick);
    return () => {
      map.off("click", handleMapBackgroundClick);
    };
  }, [dismissLens]);

  useEffect(() => {
    if (!clusterLayer) return;

    const stableOnClick = (e: any) => {
      clusterClickHandlerRef.current(e);
    };

    clusterLayer.on("clusterclick", stableOnClick);

    return () => {
      clusterLayer.off("clusterclick", stableOnClick);
    };
  }, [clusterLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;

    const emitBounds = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onBoundsChange({
        swLat: sw.lat,
        swLng: sw.lng,
        neLat: ne.lat,
        neLng: ne.lng,
        bbox: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`,
      });
    };

    emitBounds();
    map.on("moveend", emitBounds);
    map.on("zoomend", emitBounds);

    return () => {
      map.off("moveend", emitBounds);
      map.off("zoomend", emitBounds);
    };
  }, [onBoundsChange]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={(map: LeafletMap | null) => {
          if (!map) return;
          mapRef.current = map;
          setMapInstance(map);
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          zoomToBoundsOnClick={false}
          spiderfyOnEveryZoom={false}
          spiderfyOnMaxZoom={false}
          iconCreateFunction={(cluster: L.MarkerCluster) =>
            createClusterIcon(getClusterListings(cluster))
          }
          ref={(layer: LayerGroup | null) => {
            clusterRef.current = layer;
            setClusterLayer(layer);
          }}
        >
          {listings
            .filter((l) => l.address.lat && l.address.lng)
            .map((l) => {
              const isSelected =
                l.id === selectedListingId || l.id === hoveredListingId;
              const position: [number, number] = [
                Number(l.address.lat),
                Number(l.address.lng),
              ];
              const priceNumber = typeof l.listPrice === "number" ? l.listPrice : 0;
              const priceLabel =
                typeof l.listPriceFormatted === "string" && l.listPriceFormatted.length > 0
                  ? l.listPriceFormatted
                  : priceNumber > 0
                  ? `$${priceNumber.toLocaleString()}`
                  : "$0";
              const beds = l.details?.beds ?? 0;
              const baths = l.details?.baths ?? 0;
              const sqft = l.details?.sqft ?? null;
              const mainPhoto = getThumbnailUrl(l);
              const fullAddress = l.address?.full ?? "Address unavailable";
              const cityLine = `${l.address.city}, ${l.address.state} ${l.address.zip}`.trim();

              return (
                <Marker
                  key={l.id}
                  position={position}
                  icon={isSelected ? SelectedIcon : DefaultIcon}
                  ref={(marker) => {
                    if (marker) {
                      (marker as any).options.listingData = l;
                    }
                  }}
                  eventHandlers={{
                    click: () => {
                      if (overlayOpen) return;
                      if (isMobile) {
                        setPreviewListing(l);
                        return;
                      }
                      onSelectListing?.(l.id);
                      router.push(`/listing/${l.id}`);
                    },
                    popupopen: () => {
                      if (overlayOpen) return;
                      onSelectListing?.(l.id);
                    },
                    mouseover: () => {
                      if (overlayOpen) return;
                      onHoverListing?.(l.id);
                    },
                    mouseout: () => {
                      if (overlayOpen) return;
                      (onHoverListing ?? onSelectListing)?.(null);
                    },
                  }}
                >
                  {!overlayOpen && !isMobile && (
                    <Popup>
                      <div className="w-64 p-2 text-xs font-sans">
                        <div className="mb-2 w-full overflow-hidden rounded">
                          <img
                            src={mainPhoto}
                            alt={l.address.street || fullAddress}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="mb-1 text-sm font-semibold text-gray-900">
                          {priceLabel}
                        </div>
                        <div className="text-gray-600 text-xs leading-snug">
                          {fullAddress}
                          <br />
                          {cityLine}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {beds} bds • {baths} ba •{" "}
                          {typeof sqft === "number" && sqft > 0
                            ? sqft.toLocaleString()
                            : "—"}{" "}
                          sqft
                        </div>
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}
        </MarkerClusterGroup>
      </MapContainer>
      {isMobile ? (
        <MapLens isMobile onHoverListing={onHoverListing} onSelectListing={onSelectListing} />
      ) : (
        <MapLensPanePortal
          map={mapInstance}
          onHoverListing={onHoverListing}
          onSelectListing={onSelectListing}
        />
      )}
      <ListingPreviewModal
        listing={previewListing}
        isOpen={Boolean(previewListing)}
        onClose={() => setPreviewListing(null)}
      />
    </div>
  );
}
