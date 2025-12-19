"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { Listing } from "@/lib/mappers";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Default Icon issues in Next.js/Webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPanelProps {
  listings: Listing[];
  isDark?: boolean;
  onListingSelect: (l: Listing) => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPanel({ listings, isDark = true, onListingSelect }: MapPanelProps) {
  const listingsWithCoords = listings.filter(
    (l): l is Listing & { lat: number; lng: number } =>
      Number.isFinite(l.lat) && Number.isFinite(l.lng),
  );

  const center: [number, number] = listingsWithCoords.length > 0
    ? [
        listingsWithCoords.reduce((sum, l) => sum + l.lat, 0) /
          listingsWithCoords.length,
        listingsWithCoords.reduce((sum, l) => sum + l.lng, 0) /
          listingsWithCoords.length,
      ]
    : [42.96, -85.66]; // Default Grand Rapids

  const tileUrl = isDark 
    ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = isDark
    ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full z-0"
    >
      <TileLayer url={tileUrl} attribution={attribution} />
      <RecenterMap center={center} />

      {listingsWithCoords.map((l) => (
        <Marker 
          key={l.id} 
          position={[l.lat, l.lng]} 
          icon={icon}
          eventHandlers={{
            click: () => onListingSelect(l)
          }}
        >
          <Popup>
            <div 
              className="cursor-pointer min-w-[150px]"
              onClick={() => onListingSelect(l)}
            >
              <div className="font-bold">
                {l.price != null
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(l.price)
                  : "Price N/A"}
              </div>
              <div className="text-xs">{l.addressLine1}</div>
              <div className="text-xs text-slate-500">{l.beds}bd, {l.baths}ba</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
