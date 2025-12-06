"use client";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "../types";
import Image from "next/image";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Map({ listings, center, onMarkerClick }: { listings: Listing[]; center: [number, number]; onMarkerClick: (id: string) => void }) {
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }} className="z-0">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {listings.map((l) => (
        <Marker key={l.id} position={[l.lat, l.lng]} icon={markerIcon}>
          <Popup>
            <div className="w-48 cursor-pointer" onClick={() => onMarkerClick(l.id)}>
              <div className="relative aspect-video w-full bg-slate-200">
                <Image src={l.photoUrl} alt={l.addressLine1} fill className="object-cover" />
              </div>
              <div className="p-2">
                <div className="font-bold">{l.price.toLocaleString()}</div>
                <div className="text-xs">{l.addressLine1}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}