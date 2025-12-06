import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// Safe debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

type ActiveFilter =
  | null
  | "status"
  | "price"
  | "beds"
  | "baths"
  | "propertyType"
  | "more";

const chipBase =
  "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";
const chipActive = "bg-brand-copper text-white border-brand-copper";
const chipInactive = "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800";

const STATUS_OPTIONS = [
  { label: "For Sale", value: "FOR_SALE" },
  { label: "Pending", value: "PENDING" },
  { label: "Sold", value: "SOLD" },
];

const PROPERTY_TYPE_OPTIONS = [
  { label: "Single Family", value: "Single Family" },
  { label: "Condo", value: "Condo" },
  { label: "Multi-Family", value: "Multi-Family" },
  { label: "Land", value: "Land" },
];

const BEDS_OPTIONS = [
  { label: "Any", value: "0" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
];

const BATHS_OPTIONS = [
  { label: "Any", value: "0" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
];

export default function SearchFiltersBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Search Text State ---
  const [text, setText] = useState(searchParams.get("q") || "");
  const debouncedText = useDebounce(text, 500);

  // --- Filter Local State (for dropdown inputs) ---
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minSqft, setMinSqft] = useState(searchParams.get("minSqft") || "");
  const [maxDom, setMaxDom] = useState(searchParams.get("maxDaysOnMarket") || "");

  // Sync text input with URL
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== text && q !== debouncedText) {
        setText(q);
    }
  }, [searchParams]);

  // Sync URL when debounced text changes
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedText === currentQ) return;
    
    setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (debouncedText) next.set("q", debouncedText);
        else next.delete("q");
        return next;
    });
  }, [debouncedText, setSearchParams]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
  const updateParam = (key: string, value: string) => {
    setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (value && value !== "0") next.set(key, value);
        else next.delete(key);
        return next;
    });
  };

  const handleStatusSelect = (statusVal: string) => {
    const current = searchParams.get("status");
    if (current === statusVal) updateParam("status", "");
    else updateParam("status", statusVal);
    setActiveFilter(null);
  };

  const handleApplyPrice = () => {
    setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (minPrice) next.set("minPrice", minPrice); else next.delete("minPrice");
        if (maxPrice) next.set("maxPrice", maxPrice); else next.delete("maxPrice");
        return next;
    });
    setActiveFilter(null);
  };

  const handleApplyMore = () => {
    setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (minSqft) next.set("minSqft", minSqft); else next.delete("minSqft");
        if (maxDom) next.set("maxDaysOnMarket", maxDom); else next.delete("maxDaysOnMarket");
        return next;
    });
    setActiveFilter(null);
  };

  // --- Labels ---
  const currentStatus = searchParams.get("status");
  const statusLabel = STATUS_OPTIONS.find(s => s.value === currentStatus)?.label || "Buy / Pending / Sold";

  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const priceLabel = currentMinPrice || currentMaxPrice 
    ? `$${currentMinPrice || "0"} - ${currentMaxPrice ? "$" + currentMaxPrice : "Any"}`
    : "Price";

  const currentBeds = searchParams.get("minBeds");
  const bedsLabel = currentBeds ? `${currentBeds}+ Beds` : "Beds";

  const currentBaths = searchParams.get("minBaths");
  const bathsLabel = currentBaths ? `${currentBaths}+ Baths` : "Baths";

  const currentType = searchParams.get("propertyType");
  const typeLabel = currentType ? PROPERTY_TYPE_OPTIONS.find(t => t.value === currentType)?.label || currentType : "Home Type";

  const hasMoreFilters = !!searchParams.get("minSqft") || !!searchParams.get("maxDaysOnMarket");

  return (
    <div className="w-full border-t border-slate-200 dark:border-slate-800 px-4 py-2 sm:px-6 lg:px-6 relative" ref={dropdownRef}>
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-3">
        
        {/* Search Input */}
        <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
          <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:inline">Search</span>
            <input
              type="text"
              className="w-full min-w-0 border-none bg-transparent p-0 text-xs text-slate-900 focus:ring-0 placeholder:text-slate-400 dark:text-slate-100 outline-none"
              placeholder="City, ZIP, Address"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button type="button" onClick={() => setActiveFilter(activeFilter === "status" ? null : "status")} className={`${chipBase} ${currentStatus ? chipActive : chipInactive}`}>{statusLabel}</button>
            <button type="button" onClick={() => setActiveFilter(activeFilter === "price" ? null : "price")} className={`${chipBase} ${currentMinPrice || currentMaxPrice ? chipActive : chipInactive}`}>{priceLabel}</button>
            <button type="button" onClick={() => setActiveFilter(activeFilter === "beds" ? null : "beds")} className={`${chipBase} ${currentBeds ? chipActive : chipInactive}`}>{bedsLabel}</button>
            <button type="button" onClick={() => setActiveFilter(activeFilter === "baths" ? null : "baths")} className={`${chipBase} ${currentBaths ? chipActive : chipInactive}`}>{bathsLabel}</button>
            <button type="button" onClick={() => setActiveFilter(activeFilter === "propertyType" ? null : "propertyType")} className={`${chipBase} ${currentType ? chipActive : chipInactive}`}>{typeLabel}</button>
            <button type="button" onClick={() => setActiveFilter(activeFilter === "more" ? null : "more")} className={`${chipBase} ${hasMoreFilters ? chipActive : chipInactive}`}>{More}</button>
        </div>
      </div>

      {/* DROPDOWNS */}
      {activeFilter && (
        <div className="absolute left-4 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:left-auto z-50">
            {activeFilter === "status" && (
                <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-2">Status</div>
                    {STATUS_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => handleStatusSelect(opt.value)} className={`w-full rounded px-2 py-1.5 text-left text-sm ${currentStatus === opt.value ? 'bg-brand-copper text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}>{opt.label}</button>
                    ))}
                </div>
            )}
            {activeFilter === "price" && (
                 <div className="flex flex-col gap-3">
                    <div className="text-xs font-bold uppercase text-slate-500">Price Range</div>
                    <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min" className="w-full rounded border p-1 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                        <span className="text-slate-400">-</span>
                        <input type="number" placeholder="Max" className="w-full rounded border p-1 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                    </div>
                    <button onClick={handleApplyPrice} className="w-full rounded bg-brand-copper py-1.5 text-sm font-bold text-white hover:opacity-90">Apply</button>
                 </div>
            )}
            {activeFilter === "beds" && (
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase text-slate-500">Bedrooms</div>
                    <div className="grid grid-cols-3 gap-2">
                        {BEDS_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => { updateParam("minBeds", opt.value); setActiveFilter(null); }} className={`rounded border py-1 text-sm ${currentBeds === opt.value ? 'bg-brand-copper border-brand-copper text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200'}`}>{opt.label}</button>
                        ))}
                    </div>
                </div>
            )}
            {activeFilter === "baths" && (
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase text-slate-500">Bathrooms</div>
                    <div className="grid grid-cols-3 gap-2">
                        {BATHS_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => { updateParam("minBaths", opt.value); setActiveFilter(null); }} className={`rounded border py-1 text-sm ${currentBaths === opt.value ? 'bg-brand-copper border-brand-copper text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200'}`}>{opt.label}</button>
                        ))}
                    </div>
                </div>
            )}
            {activeFilter === "propertyType" && (
                 <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-2">Property Type</div>
                    {PROPERTY_TYPE_OPTIONS.map(opt => (
                         <button key={opt.value} onClick={() => { updateParam("propertyType", opt.value); setActiveFilter(null); }} className={`w-full rounded px-2 py-1.5 text-left text-sm ${currentType === opt.value ? 'bg-brand-copper text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}>{opt.label}</button>
                    ))}
                    <button onClick={() => { updateParam("propertyType", ""); setActiveFilter(null); }} className="mt-2 text-xs text-slate-500 underline">Clear</button>
                 </div>
            )}
            {activeFilter === "more" && (
                <div className="flex flex-col gap-3">
                    <div className="text-xs font-bold uppercase text-slate-500">More Options</div>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Min Sqft</span>
                        <input type="number" placeholder="1000" className="rounded border p-1 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={minSqft} onChange={e => setMinSqft(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Max Days on Market</span>
                        <input type="number" placeholder="30" className="rounded border p-1 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={maxDom} onChange={e => setMaxDom(e.target.value)} />
                    </label>
                    <button onClick={handleApplyMore} className="w-full rounded bg-brand-copper py-1.5 text-sm font-bold text-white hover:opacity-90">Apply</button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}