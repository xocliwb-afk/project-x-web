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
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { createClusterIcon } from "./map/MapClusterMarker";
import { MapLensPanePortal } from "./map/leaflet/MapLensPanePortal";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { useMapLens } from "@/hooks/useMapLens";
import { useLongPress } from "@/hooks/useLongPress";
import type { LayerGroup, LeafletEvent, Map as LeafletMap } from "leaflet";
import { MapLens } from "./map/MapLens";
import { useIsMobile } from "@/hooks/useIsMobile";
import ListingPreviewModal from "./map/ListingPreviewModal";

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
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<LayerGroup | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [previewListing, setPreviewListing] = useState<NormalizedListing | null>(null);
  const dismissLens = useMapLensStore((s) => s.dismissLens);
  const lensOpen = useMapLensStore((s) => Boolean(s.activeClusterData));
  const router = useRouter();
  const { cancelHover, openImmediate } = useMapLens();
  const isMobile = useIsMobile();
  const overlayOpen = lensOpen || Boolean(previewListing);
  const longPressTargetRef = useRef<{
    listings: NormalizedListing[];
    position: { lat: number; lng: number };
  } | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      const target = longPressTargetRef.current;
      if (target) {
        longPressTriggeredRef.current = true;
        openImmediate(target.listings, target.position);
      }
    },
    onCancel: () => {
      longPressTargetRef.current = null;
      longPressTriggeredRef.current = false;
      cancelHover(false);
    },
    thresholdMs: 300,
  });
  const defaultCenter: [number, number] = [42.9634, -85.6681];

  const firstWithCoords = listings.find((l) => l.address.lat && l.address.lng);

  const center: [number, number] = firstWithCoords
    ? [firstWithCoords.address.lat, firstWithCoords.address.lng]
    : defaultCenter;
  const getClusterListings = (cluster: L.MarkerCluster): NormalizedListing[] =>
    cluster
      .getAllChildMarkers()
      .map((m: any) => m.options?.listingData as NormalizedListing)
      .filter(Boolean);

  const handleClusterMouseOver = (_e: LeafletEvent) => {};

  const handleClusterPointerLeave = (e?: any) => {
    const oe = e?.originalEvent as PointerEvent | undefined;
    if (oe) {
      longPressHandlers.onPointerLeave(oe);
    }
    longPressTargetRef.current = null;
    longPressTriggeredRef.current = false;
  };

  const handleClusterMouseOut = (_e: LeafletEvent) => {};

  const handleClusterPointerDown = (e: any) => {
    if (overlayOpen) return;
    const oe = e.originalEvent as PointerEvent | undefined;
    if (!oe) return;
    const listingsForCluster = getClusterListings(e.layer);
    longPressTargetRef.current = {
      listings: listingsForCluster,
      position: e.layer.getLatLng(),
    };
    longPressTriggeredRef.current = false;
    longPressHandlers.onPointerDown(oe);
  };

  const handleClusterPointerMove = (e: any) => {
    if (overlayOpen) return;
    const oe = e.originalEvent as PointerEvent | undefined;
    if (!oe) return;
    longPressHandlers.onPointerMove(oe);
  };

  const handleClusterPointerUp = (e: any) => {
    if (overlayOpen) return;
    const oe = e.originalEvent as PointerEvent | undefined;
    if (!oe) return;
    longPressHandlers.onPointerUp(oe);
    if (longPressTriggeredRef.current) {
      oe.stopPropagation();
      oe.preventDefault();
      // do not reset here; click handler will consume and reset
    } else {
      longPressTargetRef.current = null;
    }
  };

  const handleClusterClick = (e: any) => {
    if (overlayOpen) return;
    if (debugEnabled) {
      console.log("[Map] clusterclick", {
        longPressTriggered: longPressTriggeredRef.current,
        overlayOpen,
        lensOpen,
        previewOpen: Boolean(previewListing),
        isMobile,
      });
    }
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      longPressTargetRef.current = null;
      e.originalEvent?.stopPropagation?.();
      e.originalEvent?.preventDefault?.();
      return;
    }
    const cluster = e.layer as L.MarkerCluster;
    const listingsForCluster = getClusterListings(cluster);
    const latLng = cluster.getLatLng();

    openImmediate(listingsForCluster, latLng);

    e.originalEvent?.stopPropagation?.();
    e.originalEvent?.preventDefault?.();
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on("movestart", dismissLens);
    return () => {
      map.off("movestart", dismissLens);
    };
  }, [dismissLens]);

  useEffect(() => {
    const layer = clusterRef.current;
    if (!layer) return;

    const onOver = (e: LeafletEvent) => handleClusterMouseOver(e);
    const onOut = (e: LeafletEvent) => handleClusterMouseOut(e);
    const onClick = (e: LeafletEvent) => handleClusterClick(e);
    const onMouseDown = (e: LeafletEvent) => handleClusterPointerDown(e);
    const onMouseMove = (e: LeafletEvent) => handleClusterPointerMove(e);
    const onMouseUp = (e: LeafletEvent) => handleClusterPointerUp(e);
    const onTouchEnd = (e: LeafletEvent) => handleClusterPointerUp(e);
    const onTouchMove = (e: LeafletEvent) => handleClusterPointerLeave(e);
    layer.on("clustermouseover", onOver);
    layer.on("clustermouseout", onOut);
    layer.on("clusterclick", onClick);
    layer.on("clustermousedown", onMouseDown);
    layer.on("clustermousemove", onMouseMove);
    layer.on("clustermouseup", onMouseUp);
    layer.on("clustertouchend", onTouchEnd);
    layer.on("clustertouchmove", onTouchMove);

    return () => {
      layer.off("clustermouseover", onOver);
      layer.off("clustermouseout", onOut);
    layer.off("clusterclick", onClick);
    layer.off("clustermousedown", onMouseDown);
    layer.off("clustermousemove", onMouseMove);
    layer.off("clustermouseup", onMouseUp);
    layer.off("clustertouchend", onTouchEnd);
    layer.off("clustertouchmove", onTouchMove);
    };
  }, [
    handleClusterClick,
    handleClusterMouseOut,
    handleClusterMouseOver,
    handleClusterPointerDown,
    handleClusterPointerLeave,
    handleClusterPointerMove,
    handleClusterPointerUp,
  ]);

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
          iconCreateFunction={(cluster: L.MarkerCluster) =>
            createClusterIcon(getClusterListings(cluster))
          }
          ref={(layer: LayerGroup | null) => {
            clusterRef.current = layer;
          }}
        >
          {listings
            .filter((l) => l.address.lat && l.address.lng)
            .map((l) => {
              const isSelected =
                l.id === selectedListingId || l.id === hoveredListingId;
              const position: [number, number] = [l.address.lat, l.address.lng];
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
              const mainPhoto = l.media?.photos?.[0] ?? "/placeholder-house.jpg";
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
