import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import type { Listing } from "./data/listings";
import { mockListings } from "./data/listings";
import SearchFiltersBar from "./components/SearchFiltersBar";
import MapPanel from "./components/MapPanel";
import ListingDetailModal from "./components/ListingDetailModal";

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

          {/* Row 2: Search Filters Bar */}
          {isSearchRoute && <SearchFiltersBar />}
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="relative flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route
              path="/search"
              element={<SearchPage listings={mockListings} mapSide={mapSide} />}
            />
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

// ------------ SEARCH PAGE (FILTERED) ------------

type SearchPageProps = {
  listings: Listing[];
  mapSide: "left" | "right";
};

function SearchPage({ listings, mapSide }: SearchPageProps) {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // --- FILTERING LOGIC ---
  const filteredListings = useMemo(() => {
    const q = (searchParams.get("q") || "").toLowerCase();
    const minPrice = Number(searchParams.get("minPrice")) || 0;
    const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
    const minBeds = Number(searchParams.get("minBeds")) || 0;
    const minBaths = Number(searchParams.get("minBaths")) || 0;
    const status = searchParams.get("status");
    const propertyType = searchParams.get("propertyType");
    const minSqft = Number(searchParams.get("minSqft")) || 0;
    const maxDom = Number(searchParams.get("maxDaysOnMarket")) || Infinity;

    return listings.filter((l) => {
        // Text Search
        if (q && !l.addressLine1.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q) && !l.zip.includes(q)) return false;
        
        // Price
        if (l.price < minPrice || l.price > maxPrice) return false;
        
        // Beds/Baths
        if (l.beds < minBeds) return false;
        if (l.baths < minBaths) return false;

        // Status
        if (status && l.status !== status) return false;

        // Property Type
        if (propertyType && l.propertyType !== propertyType) return false;

        // Sqft & DOM
        if (l.sqft < minSqft) return false;
        if (l.daysOnMarket > maxDom) return false;

        return true;
    });
  }, [listings, searchParams]);

  const total = filteredListings.length;

  return (
    <>
      <main className="grid h-full w-full lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        
        {/* 1. LIST COLUMN */}
        <div
          className={
            "relative flex h-full flex-col overflow-y-auto scroll-smooth " +
            (mapSide === "left" ? "lg:order-2" : "lg:order-1")
          }
        >
          <div className="p-2 sm:p-3 lg:p-4">
            
            {/* Results Summary */}
            <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] ring-1 ${isDark ? 'bg-slate-900/50 text-slate-300 ring-slate-800' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Showing {total} homes</span>
                  {total < listings.length && <span className="text-slate-500">(filtered)</span>}
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
              {filteredListings.map((listing) => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  isDark={isDark} 
                  onSelect={() => setSelectedListing(listing)}
                />
              ))}
              {filteredListings.length === 0 && (
                  <div className="col-span-full py-10 text-center text-slate-500">
                      No homes found matching your filters.
                  </div>
              )}
            </div>
             <div className="h-12"></div>
          </div>
        </div>

        {/* 2. MAP COLUMN */}
        <aside
          className={
            "relative h-full w-full bg-slate-200 " +
            (mapSide === "left" ? "lg:order-1" : "lg:order-2")
          }
        >
          <MapPanel 
            listings={filteredListings} 
            isDark={isDark} 
            onListingSelect={setSelectedListing}
          />
        </aside>
      </main>

      {/* 3. MODAL (PDP) */}
      <ListingDetailModal 
        listing={selectedListing} 
        isOpen={!!selectedListing} 
        onClose={() => setSelectedListing(null)} 
      />
    </>
  );
}

// ------------ LISTING CARD ------------

function ListingCard({ 
  listing, 
  isDark,
  onSelect
}: { 
  listing: Listing; 
  isDark: boolean;
  onSelect: () => void;
}) {
  const {
    price, status, daysOnMarket, addressLine1, city, state, zip, beds, baths, sqft, neighborhood, region, photoUrl,
  } = listing;

  const statusColor = status === "FOR_SALE" ? "bg-emerald-400 text-emerald-950" : status === "PENDING" ? "bg-amber-300 text-amber-950" : "bg-slate-400 text-slate-800";
  const cardClasses = isDark ? "bg-slate-900/90 ring-slate-800 shadow-slate-950/60" : "bg-white ring-slate-200 shadow-slate-300/60";
  const textPrimary = isDark ? "text-slate-50" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-300" : "text-slate-600";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const priceBadge = isDark ? "bg-slate-950/90 ring-slate-700/80 text-slate-50" : "bg-slate-100 ring-slate-300 text-slate-900";

  return (
    <article 
      className={`group overflow-hidden rounded-3xl ring-1 transition-all hover:shadow-xl cursor-pointer ${cardClasses}`}
      onClick={onSelect}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
        <img src={photoUrl} alt={addressLine1} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute top-3 left-3">
          <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
            {status.replace("_", " ")}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${priceBadge}`}>
            {daysOnMarket} days on mkt
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1"><div><div className={`text-xl font-bold ${textPrimary}`}>{currency.format(price)}</div></div></div>
        <div className={`truncate text-sm font-medium ${textPrimary}`}>{addressLine1}</div>
        <div className={`truncate text-xs ${textSecondary}`}>{city}, {state} {zip}</div>
        <div className={`mt-3 flex items-center gap-3 text-xs ${textSecondary}`}>
          <span className="flex items-center gap-1"><span className={`font-bold ${textPrimary}`}>{beds}</span> bds</span>
          <span className="flex items-center gap-1"><span className={`font-bold ${textPrimary}`}>{baths}</span> ba</span>
          <span className="flex items-center gap-1"><span className={`font-bold ${textPrimary}`}>{sqft.toLocaleString()}</span> sqft</span>
        </div>
        <div className={`mt-3 border-t pt-2 text-[10px] uppercase tracking-wider ${textMuted} ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
           {neighborhood || region}
        </div>
      </div>
    </article>
  );
}

export default AppShell;