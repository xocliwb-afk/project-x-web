import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import { Listing, mockListings } from "./data/listings";

const ThemeContext = createContext<{
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}>({
  isDark: true,
  setIsDark: () => {},
});

const useTheme = () => useContext(ThemeContext);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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

function AppShell() {
  const location = useLocation();
  const isSearchRoute = location.pathname === "/search";

  const [mapSide, setMapSide] = useState<"left" | "right">("left");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const outerBg = isDark ? "bg-slate-900" : "bg-slate-50";
  const outerText = isDark ? "text-slate-50" : "text-slate-900";
  const headerBg = isDark
    ? "bg-slate-950/80 border-slate-800"
    : "bg-white/80 border-slate-200";

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      <div className={`min-h-screen ${outerBg} ${outerText}`}>
        <header
          className={`sticky top-0 z-10 border-b ${headerBg} backdrop-blur`}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-copper text-xs font-semibold tracking-tight text-slate-900">
                PX
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Project X
                </div>
                <div className="text-sm font-medium">
                  White-Label Real Estate Search
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className="hidden rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex border-slate-500/70 hover:bg-slate-800/60"
              >
                {isDark ? "Light mode" : "Dark mode"}
              </button>

              <nav className="flex items-center gap-2 text-xs sm:text-sm">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    [
                      "rounded-full px-3 py-1.5 font-medium transition-colors",
                      isActive
                        ? isDark
                          ? "bg-slate-800 text-slate-50"
                          : "bg-slate-200 text-slate-900"
                        : isDark
                        ? "text-slate-400 hover:bg-slate-800/70 hover:text-slate-50"
                        : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  Overview
                </NavLink>
                <NavLink
                  to="/search"
                  className={({ isActive }) =>
                    [
                      "rounded-full px-3 py-1.5 font-semibold transition-colors",
                      isActive
                        ? "bg-brand-copper text-slate-900"
                        : "bg-slate-100/5 text-slate-100 hover:bg-brand-copper hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  Search Prototype
                </NavLink>
              </nav>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route
            path="/search"
            element={
              <SearchPage
                listings={mockListings}
                mapSide={mapSide}
                setMapSide={setMapSide}
              />
            }
          />
          <Route path="*" element={isSearchRoute ? null : <OverviewPage />} />
        </Routes>
      </div>
    </ThemeContext.Provider>
  );
}

function OverviewPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Project X – White-Label Real Estate Search
      </h1>
      <p className="mt-4 text-sm leading-relaxed sm:text-base text-slate-300/90">
        This is a working prototype of a modern, white-label real estate search
        experience inspired by best practices from Zillow, Redfin, and
        Realtor.com. Use the “Search Prototype” tab to explore the live search
        UI with mock West Michigan inventory.
      </p>
    </main>
  );
}

type SearchPageProps = {
  listings: Listing[];
  mapSide: "left" | "right";
  setMapSide: (side: "left" | "right") => void;
};

function SearchPage({ listings, mapSide, setMapSide }: SearchPageProps) {
  const { isDark } = useTheme();
  const total = listings.length;

  const center: LatLngExpression = useMemo(() => {
    if (!listings.length) return [42.96, -85.64];
    const avgLat =
      listings.reduce((sum, l) => sum + l.lat, 0) / listings.length;
    const avgLng =
      listings.reduce((sum, l) => sum + l.lng, 0) / listings.length;
    return [avgLat, avgLng];
  }, [listings]);

  const mapTileUrl = isDark
    ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const mapAttribution = isDark
    ? '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    : "&copy; OpenStreetMap contributors";

  return (
    <main className="min-h-screen pt-4 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl p-4 shadow-xl ring-1 sm:p-6 bg-slate-900/95 ring-slate-800 shadow-slate-950/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Search West Michigan listings
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Powered by a local mock dataset · behaves like real inventory.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="mt-1 inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 sm:text-sm">
                <span className="mr-1.5 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                {total} matching homes
              </div>
              <div className="hidden items-center gap-1 rounded-full bg-slate-900 px-1 py-1 text-[11px] text-slate-300 ring-1 ring-slate-700/80 sm:flex">
                <span className="px-2 py-0.5 font-medium uppercase tracking-[0.16em] text-slate-500">
                  Map side
                </span>
                <button
                  type="button"
                  onClick={() => setMapSide("left")}
                  className={
                    "rounded-full px-2 py-0.5 text-xs transition-colors " +
                    (mapSide === "left"
                      ? "bg-brand-copper text-slate-900"
                      : "text-slate-300 hover:bg-slate-800")
                  }
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setMapSide("right")}
                  className={
                    "rounded-full px-2 py-0.5 text-xs transition-colors " +
                    (mapSide === "right"
                      ? "bg-brand-copper text-slate-900"
                      : "text-slate-300 hover:bg-slate-800")
                  }
                >
                  Right
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <button className="inline-flex items-center justify-between rounded-full bg-slate-950/80 px-4 py-2 text-left text-slate-200 ring-1 ring-slate-700/80 hover:bg-slate-900 hover:ring-slate-600">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Location
              </span>
              <span className="ml-2 text-sm">
                City, neighborhood, or address
              </span>
            </button>
            <button className="inline-flex items-center justify-center rounded-full bg-slate-950/80 px-4 py-2 text-slate-200 ring-1 ring-slate-700/80 hover:bg-slate-900 hover:ring-slate-600">
              Beds
            </button>
            <div className="flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2 ring-1 ring-slate-700/80">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Price
              </span>
              <span className="ml-2 text-xs text-slate-400">Min</span>
              <span className="mx-1 text-slate-600">–</span>
              <span className="text-xs text-slate-400">Max</span>
            </div>
            <button className="rounded-full px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100">
              Clear
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <div
            className={
              "space-y-3 " + (mapSide === "left" ? "lg:order-2" : "lg:order-1")
            }
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Showing {total} homes in West Michigan</span>
              <button className="hidden rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700/80 hover:bg-slate-800 sm:inline-flex">
                Sort: Newest
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} isDark={isDark} />
              ))}
            </div>
          </div>

          <aside
            className={
              "lg:sticky lg:top-20 " +
              (mapSide === "left" ? "lg:order-1" : "lg:order-2")
            }
          >
            <div className="h-64 overflow-hidden rounded-3xl ring-1 shadow-2xl ring-slate-800 shadow-slate-950/70 sm:h-80 lg:h-[520px]">
              <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={true}
                className="z-0 h-full w-full"
              >
                <TileLayer attribution={mapAttribution} url={mapTileUrl} />
                {listings.map((listing) => (
                  <Marker
                    key={listing.id}
                    position={[listing.lat, listing.lng]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <div className="text-xs text-slate-900">
                        <div className="font-semibold">
                          {listing.addressLine1}
                        </div>
                        <div>
                          {listing.city}, {listing.state} {listing.zip}
                        </div>
                        <div className="mt-1">
                          {currency.format(listing.price)} · {listing.beds} bd · {listing.baths} ba
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Map is powered by OpenStreetMap tiles via Leaflet. In production,
              this panel can be swapped for Google Maps, Mapbox, or an IDX
              provider while keeping the same layout. (Map tile changes depending on Light/Dark mode).
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ListingCard({
  listing,
  isDark,
}: {
  listing: Listing;
  isDark: boolean;
}) {
  const {
    price,
    status,
    daysOnMarket,
    addressLine1,
    city,
    state,
    zip,
    beds,
    baths,
    sqft,
    neighborhood,
    region,
    photoUrl,
  } = listing;

  const statusColor =
    status === "FOR_SALE"
      ? "bg-emerald-400 text-emerald-950"
      : status === "PENDING"
      ? "bg-amber-300 text-amber-950"
      : "bg-slate-400 text-slate-800";

  const cardClasses = isDark
    ? "bg-slate-900/90 ring-slate-800 shadow-slate-950/60"
    : "bg-white ring-slate-200 shadow-slate-300/60";

  const textPrimary = isDark ? "text-slate-50" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-300" : "text-slate-600";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const priceBadge = isDark
    ? "bg-slate-950/90 ring-slate-700/80 text-slate-50"
    : "bg-slate-100 ring-slate-300 text-slate-900";

  return (
    <article
      className={`group overflow-hidden rounded-3xl ring-1 shadow-lg transition-transform hover:-translate-y-1 hover:ring-slate-500/80 ${cardClasses}`}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={photoUrl}
          alt={addressLine1}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="space-y-2 px-4 pb-4 pt-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <div
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${priceBadge}`}
            >
              {currency.format(price)}
            </div>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
                statusColor
              }
            >
              {status}
            </span>
          </div>
          <p className={`text-xs ${textMuted}`}>{daysOnMarket} days on market</p>
        </div>

        <div className="space-y-1">
          <h3 className={`text-sm font-semibold ${textPrimary}`}>
            {addressLine1}
          </h3>
          <p className={`text-xs ${textSecondary}`}>
            {city}, {state} {zip}
          </p>
        </div>

        <div className={`flex items-center gap-3 text-xs ${textSecondary}`}>
          <span>
            {beds} bd · {baths} ba · {sqft.toLocaleString()} sqft
          </span>
        </div>

        <p className={`text-[11px] ${textMuted}`}>
          {neighborhood ? `${neighborhood} · ` : ""}
          {region}
        </p>
      </div>
    </article>
  );
}

export default function App() {
  return <AppShell />;
}
