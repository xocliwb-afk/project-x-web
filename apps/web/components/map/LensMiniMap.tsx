"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { NormalizedListing } from "@project-x/shared-types";

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
  const hasListingsWithCoords = listings.some(
    (l) => typeof l.address?.lat === "number" && typeof l.address?.lng === "number",
  );

  const firstWithCoords = listings.find(
    (l) => typeof l.address?.lat === "number" && typeof l.address?.lng === "number",
  );

  const effectiveCenter: [number, number] = hasListingsWithCoords
    ? [firstWithCoords!.address.lat as number, firstWithCoords!.address.lng as number]
    : center;

  return (
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
      {listings
        .filter((l) => typeof l.address?.lat === "number" && typeof l.address?.lng === "number")
        .map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.address.lat as number, listing.address.lng as number]}
            icon={DefaultIcon}
            eventHandlers={{
              click: () => onMarkerClick(listing),
            }}
          />
        ))}
    </MapContainer>
  );
}
