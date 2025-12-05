import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import type { Listing } from "./data/listings";
import { mockListings } from "./data/listings";

// ------------ THEME CONTEXT ------------

const ThemeContext = createContext<{
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}>({
  isDark: true,
  setIsDark: () => {},
});

const useTheme = () => useContext(ThemeContext);

// ------------ SHARED UTILITIES ------------

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

// ------------ APP SHELL ------------

function AppShell() {
  const location = useLocation();
  const isSearchRoute = location.pathname === "/search";
  const [mapSide, setMapSide] = useState<"left" | "right">("left");
  const [isDark, setIsDark] = useState(true);

  // Toggle Tailwind dark mode on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const outerBg = isDark ? "bg-slate-900" : "bg-slate-50";
  const outerText = isDark ? "text-slate-50" : "text-slate-900";
  const headerBg = isDark
    ? "bg-slate-950 border-slate-800"
    : "bg-white border-slate-200";

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {/* Root container is fixed height (h-screen) to enable independent internal scrolling */}
      <div className={`flex h-screen flex-col overflow-hidden ${outerBg} ${outerText}`}>
        
        {/* TOP CHROME: Fixed Header + Search Strip */}
        <header className={`z-40 flex shrink-0 flex-col border-b shadow-sm ${headerBg}`}>
          
          {/* Row 1: Logo, Nav, Controls */}
          <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-3 sm:px-6 lg:px-6">
            {/* Logo + title */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-copper text-[11px] font-semibold tracking-tight text-slate-900">
                PX
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Project X
                </div>
                <div className="text-xs font-medium">
                  White-Label Real Estate Search
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className="hidden rounded-full border border-slate-500/70 px-3 py-1 font-medium sm:inline-flex hover:bg-slate-800/60"
              >
                {isDark ? "Light mode" : "Dark mode"}
              </button>

              <nav className="flex items-center gap-1 sm:gap-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    [
                      "rounded-full px-2.5 py-1 font-medium transition-colors",
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
                      "rounded-full px-3 py-1 font-semibold transition-colors",
                      isActive
                        ? "bg-brand-copper text-slate-900"
                        : "bg-slate-100/5 text-slate-100 hover:bg-brand-copper hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  Search Prototype
                </NavLink>
              </nav>

              <div
                className={
                  "hidden items-center gap-1 rounded-full px-1 py-1 text-[10px] ring-1 sm:flex " +
                  (isDark
                    ? "bg-slate-950 text-slate-300 ring-slate-700"
                    : "bg-slate-100 text-slate-700 ring-slate-300")
                }
              >
                <span className="px-2 py-0.5 font-medium uppercase tracking-[0.16em] text-slate-500">
                  Map
                </span>
                <button
                  type="button"
                  onClick={() => setMapSide("left")}
                  className={
                    "rounded-full px-2 py-0.5 transition-colors " +
                    (mapSide === "left"
                      ? "bg-brand-copper text-slate-900"
                      : "hover:bg-slate-800/70 hover:text-slate-50")
                  }
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setMapSide("right")}
                  className={
                    "rounded-full px-2 py-0.5 transition-colors " +
                    (mapSide === "right"
                      ? "bg-brand-copper text-slate-900"
                      : "hover:bg-slate-800/70 hover:text-slate-50")
                  }
                >
                  Right
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Search Bar & Filters (Only visible on Search Route) */}
          {isSearchRoute && (
            <div className={`w-full border-t px-4 py-2 sm:px-6 lg:px-6 ${isDark ? 'border-slate-800/50' : 'border-slate-200'}`}>
              <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-2">
                 {/* Address field */}
                <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 ${isDark ? 'bg-slate-900 text-slate-200 ring-slate-700' : 'bg-slate-100 text-slate-700 ring-slate-300'}`}>
                    <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:inline">
                      Search
                    </span>
                    <span className="inline-flex h-1 w-1 rounded-full bg-slate-500 sm:hidden" />
                    <span className={`truncate text-[11px] sm:text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Address, neighborhood, city, ZIP
                    </span>
                  </div>
                </div>

                {/* Chips */}
                <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {[ "For sale", "Price", "Beds", "Baths", "Home type", "More filters"].map((label) => (
                     <button key={label} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ring-1 ${isDark ? 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-slate-800' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'}`}>
                       {label}
                     </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="relative flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route
              path="/search"
              element={<SearchPage listings={mockListings} mapSide={mapSide} />}
            />
            {/* simple fallback */}
            <Route path="*" element={isSearchRoute ? null : <OverviewPage />} />
          </Routes>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

// ------------ OVERVIEW PAGE ------------

function OverviewPage() {
  return (
    // Needs its own scrolling since parent is overflow-hidden
    <main className="h-full w-full overflow-y-auto bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          Project X - White-Label Real Estate Search
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300/90 sm:text-base">
          This is a working prototype of a modern, white-label real estate search
          experience inspired by best practices from Zillow, Redfin, and
          Realtor.com. Use the Search Prototype tab to explore the live search UI
          with mock West Michigan inventory.
        </p>
      </div>
    </main>
  );
}

// ------------ SEARCH PAGE ------------

type SearchPageProps = {
  listings: Listing[];
  mapSide: "left" | "right";
};

function SearchPage({ listings, mapSide }: SearchPageProps) {
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
    <main className="grid h-full w-full lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      
      {/* 1. LIST COLUMN (Scrolls independently) */}
      <div
        className={
          "relative flex h-full flex-col overflow-y-auto scroll-smooth " +
          (mapSide === "left" ? "lg:order-2" : "lg:order-1")
        }
      >
        <div className="p-2 sm:p-3 lg:p-4">
          
          {/* Results Summary Bar (Scrolls with cards) */}
          <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] ring-1 ${isDark ? 'bg-slate-900/50 text-slate-300 ring-slate-800' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Showing {total} homes</span>
                <button className="hover:underline">Clear</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-full bg-brand-copper px-3 py-1 text-[10px] font-bold text-slate-900 hover:bg-[color:var(--accent-copper-hover)]">
                  Save Search
                </button>
                <div className="h-4 w-px bg-slate-500/30"></div>
                <button className="font-medium hover:text-brand-copper">Sort: Newest</button>
              </div>
          </div>

          <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
            West Michigan Listings
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isDark={isDark} />
            ))}
          </div>

           {/* Footer spacer */}
           <div className="h-12"></div>
        </div>
      </div>

      {/* 2. MAP COLUMN (Static/Sticky behavior) */}
      <aside
        className={
          "relative h-full w-full bg-slate-200 " +
          (mapSide === "left" ? "lg:order-1" : "lg:order-2")
        }
      >
        {/* Map takes full height of this column */}
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer attribution={mapAttribution} url={mapTileUrl} />
          {listings.map((listing) => (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={markerIcon}
            >
              <Popup>
                {/* Updated Popup Content */}
                <div className="w-48 overflow-hidden rounded-md bg-white shadow-sm dark:bg-slate-900">
                  <div className="relative aspect-video w-full bg-slate-200">
                    <img 
                      src={listing.photoUrl} 
                      alt="" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 p-2 text-slate-900 dark:text-slate-100">
                    <div className="text-sm font-bold">{currency.format(listing.price)}</div>
                    <div className="truncate text-[10px] font-medium opacity-90">{listing.addressLine1}</div>
                    <div className="truncate text-[10px] opacity-70">{listing.city}, {listing.state} {listing.zip}</div>
                    <div className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                       {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </aside>
    </main>
  );
}

// ------------ LISTING CARD ------------

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
      className={`group overflow-hidden rounded-3xl ring-1 transition-all hover:shadow-xl ${cardClasses}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
        <img
          src={photoUrl}
          alt={addressLine1}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
          >
            {status.replace("_", " ")}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span
            className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${priceBadge}`}
          >
            {daysOnMarket} days on mkt
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-1">
          <div className={`text-xl font-bold ${textPrimary}`}>
            {currency.format(price)}
          </div>
        </div>
        
        <div className={`truncate text-sm font-medium ${textPrimary}`}>
          {addressLine1}
        </div>
        <div className={`truncate text-xs ${textSecondary}`}>
          {city}, {state} {zip}
        </div>

        <div className={`mt-3 flex items-center gap-3 text-xs ${textSecondary}`}>
          <span className="flex items-center gap-1">
            <span className={`font-bold ${textPrimary}`}>{beds}</span> bds
          </span>
          <span className="flex items-center gap-1">
            <span className={`font-bold ${textPrimary}`}>{baths}</span> ba
          </span>
          <span className="flex items-center gap-1">
            <span className={`font-bold ${textPrimary}`}>{sqft.toLocaleString()}</span> sqft
          </span>
        </div>
        
        <div className={`mt-3 border-t pt-2 text-[10px] uppercase tracking-wider ${textMuted} ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
           {neighborhood || region}
        </div>
      </div>
    </article>
  );
}

export default AppShell;