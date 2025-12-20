"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { NormalizedListing } from "@project-x/shared-types";
import { useMapLensStore } from "@/stores/useMapLensStore";
import { useRef } from "react";

type LensMiniMapProps = {
  center: [number, number];
  listings: NormalizedListing[];
  bounds?: L.LatLngBounds | null;
  onMarkerClick: (listing: NormalizedListing) => void;
};

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

function FitBounds({ bounds }: { bounds?: L.LatLngBounds | null }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds || !bounds.isValid()) return;
    map.fitBounds(bounds, { padding: [20, 20], animate: false });
  }, [map, bounds]);

  return null;
}

export function LensMiniMap({ center, listings, bounds, onMarkerClick }: LensMiniMapProps) {
  const setFocusedListingId = useMapLensStore((s) => s.setFocusedListingId);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const listingsWithCoords = listings.filter(
    (l): l is NormalizedListing & { address: { lat: number; lng: number } } =>
      Number.isFinite(l.address?.lat) && Number.isFinite(l.address?.lng),
  );

  const firstWithCoords = listingsWithCoords[0];

  const effectiveCenter: [number, number] =
    listingsWithCoords.length > 0 && firstWithCoords
      ? [firstWithCoords.address.lat, firstWithCoords.address.lng]
      : center;

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    if ((L as any).DomEvent) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  return (
    <div
      className="w-full h-full"
      ref={wrapperRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <MapContainer
        center={effectiveCenter}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {bounds && <FitBounds bounds={bounds} />}
        {listingsWithCoords.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.address.lat, listing.address.lng]}
            icon={DefaultIcon}
            eventHandlers={{
              click: () => {
                setFocusedListingId(listing.id);
                onMarkerClick(listing);
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
