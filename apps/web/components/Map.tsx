"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing as NormalizedListing } from "@project-x/shared-types";
import { useRef } from "react";

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
  hoveredListingId?: string | null;
  onSelectListing?: (id: string | null) => void;
}

export default function Map({
  listings,
  selectedListingId,
  hoveredListingId,
  onSelectListing,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const defaultCenter: [number, number] = [42.9634, -85.6681];

  const firstWithCoords = listings.find((l) => l.address.lat && l.address.lng);

  const center: [number, number] = firstWithCoords
    ? [firstWithCoords.address.lat, firstWithCoords.address.lng]
    : defaultCenter;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
                eventHandlers={{
                  click: () => {
                    onSelectListing?.(l.id);
                    mapRef.current?.flyTo(position, mapRef.current.getZoom());
                  },
                  popupopen: () => {
                    onSelectListing?.(l.id);
                  },
                }}
              >
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
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
