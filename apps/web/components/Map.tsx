"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing as NormalizedListing } from "@project-x/shared-types";
import { useEffect } from "react";

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

interface MapProps {
  listings: NormalizedListing[];
  selectedListingId?: string | null;
  onSelectListing?: (id: string) => void;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({
  listings,
  selectedListingId,
  onSelectListing,
}: MapProps) {
  const defaultCenter: [number, number] = [42.9634, -85.6681];

  const selectedListing = listings.find((l) => l.id === selectedListingId);
  const firstWithCoords = listings.find((l) => l.address.lat && l.address.lng);

  const center: [number, number] =
    selectedListing && selectedListing.address.lat && selectedListing.address.lng
      ? [selectedListing.address.lat, selectedListing.address.lng]
      : firstWithCoords
      ? [firstWithCoords.address.lat, firstWithCoords.address.lng]
      : defaultCenter;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={center} />

        {listings
          .filter((l) => l.address.lat && l.address.lng)
          .map((l) => {
            const isSelected = l.id === selectedListingId;
            const position: [number, number] = [l.address.lat, l.address.lng];

            return (
              <Marker
                key={l.id}
                position={position}
                icon={isSelected ? SelectedIcon : DefaultIcon}
                eventHandlers={{
                  click: () => onSelectListing?.(l.id),
                }}
              >
                <Popup>
                  <div className="text-xs font-sans min-w-[160px]">
                    {(l.thumbnailUrl || (l.photos && l.photos[0])) && (
                      <div className="mb-2 w-full overflow-hidden rounded">
                        <img
                          src={l.thumbnailUrl || l.photos[0]}
                          alt={l.address.street}
                          className="h-24 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="mb-1 text-sm font-semibold text-gray-900">
                      ${l.price.toLocaleString()}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {l.address.street}
                      <br />
                      {l.address.city}, {l.address.state} {l.address.zip}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {l.specs.beds} bds • {l.specs.baths} ba •{" "}
                      {l.specs.sqft.toLocaleString()} sqft
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
