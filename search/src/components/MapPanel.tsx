import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import { useEffect } from "react";
import type { Listing } from "../data/listings";

// Fix Leaflet's default icon path issues in bundlers
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPanelProps {
  listings: Listing[];
  isDark: boolean;
  onListingSelect: (listing: Listing) => void;
}

// Helper to auto-center map when listings change
function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPanel({
  listings,
  isDark,
  onListingSelect,
}: MapPanelProps) {
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const center: LatLngExpression =
    listings.length > 0
      ? [
          listings.reduce((sum, l) => sum + l.lat, 0) / listings.length,
          listings.reduce((sum, l) => sum + l.lng, 0) / listings.length,
        ]
      : [42.96, -85.64];

  const mapTileUrl = isDark
    ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const mapAttribution = isDark
    ? '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    : "&copy; OpenStreetMap contributors";

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer attribution={mapAttribution} url={mapTileUrl} />
      <RecenterMap center={center} />

      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={markerIcon}
          eventHandlers={{
            click: () => onListingSelect(listing),
          }}
        >
          <Popup>
            <div
              className="w-48 overflow-hidden rounded-md bg-white shadow-sm dark:bg-slate-900 cursor-pointer"
              onClick={() => onListingSelect(listing)}
            >
              <div className="relative aspect-video w-full bg-slate-200">
                <img
                  src={listing.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5 p-2 text-slate-900 dark:text-slate-100">
                <div className="text-sm font-bold">
                  {currency.format(listing.price)}
                </div>
                <div className="truncate text-[10px] font-medium opacity-90">
                  {listing.addressLine1}
                </div>
                <div className="truncate text-[10px] opacity-70">
                  {listing.city}, {listing.state} {listing.zip}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {listing.beds} bd · {listing.baths} ba ·{" "}
                  {listing.sqft.toLocaleString()} sqft
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}