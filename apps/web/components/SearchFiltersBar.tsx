"use client";

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  type MutableRefObject,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
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
const chipActive = "border-orange-500 bg-orange-500 text-white";
const chipInactive =
  "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

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

const PRICE_OPTIONS = [
  { label: "No min", value: "" },
  { label: "$100k", value: "100000" },
  { label: "$150k", value: "150000" },
  { label: "$200k", value: "200000" },
  { label: "$250k", value: "250000" },
  { label: "$300k", value: "300000" },
  { label: "$400k", value: "400000" },
  { label: "$500k", value: "500000" },
  { label: "$750k", value: "750000" },
  { label: "$1M", value: "1000000" },
  { label: "$1.5M", value: "1500000" },
  { label: "$2M", value: "2000000" },
];

const DOM_OPTIONS = [
  { label: "Any", value: "" },
  { label: "1 day", value: "1" },
  { label: "Less than 3", value: "3" },
  { label: "Less than 7", value: "7" },
  { label: "Less than 30", value: "30" },
];

export default function SearchFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);
  const chipRefs: MutableRefObject<Record<string, HTMLButtonElement | null>> =
    useRef({});

  const [text, setText] = useState(searchParams.get("q") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minBeds, setMinBeds] = useState(searchParams.get("beds") || "");
  const [minBaths, setMinBaths] = useState(searchParams.get("baths") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") || ""
  );
  const [minSqft, setMinSqft] = useState(searchParams.get("minSqft") || "");
  const [maxSqft, setMaxSqft] = useState(searchParams.get("maxSqft") || "");
  const [minYearBuilt, setMinYearBuilt] = useState(
    searchParams.get("minYearBuilt") || ""
  );
  const [maxYearBuilt, setMaxYearBuilt] = useState(
    searchParams.get("maxYearBuilt") || ""
  );
  const [maxDaysOnMarket, setMaxDaysOnMarket] = useState(
    searchParams.get("maxDaysOnMarket") || ""
  );
  const [keywords, setKeywords] = useState(searchParams.get("keywords") || "");

  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== text && q !== debouncedText) {
      setText(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedText === currentQ) return;
    updateParams({ q: debouncedText });
  }, [debouncedText]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveFilter(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const openFilter = (filter: ActiveFilter, chipKey: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
      return;
    }
    const chip = chipRefs.current[chipKey];
    if (chip && barRef.current) {
      const chipRect = chip.getBoundingClientRect();
      const barRect = barRef.current.getBoundingClientRect();
      const center = chipRect.left + chipRect.width / 2;
      const relative = center - barRect.left;
      setDropdownLeft(relative);
    } else {
      setDropdownLeft(null);
    }
    setActiveFilter(filter);
  };

  const clearStatus = () => updateParams({ status: null });
  const clearPrice = () => {
    setMinPrice("");
    setMaxPrice("");
    updateParams({ minPrice: null, maxPrice: null });
  };
  const clearBeds = () => {
    setMinBeds("");
    updateParams({ beds: null });
  };
  const clearBaths = () => {
    setMinBaths("");
    updateParams({ baths: null });
  };
  const clearPropertyType = () => {
    setPropertyType("");
    updateParams({ propertyType: null });
  };
  const clearMore = () => {
    setMinSqft("");
    setMaxSqft("");
    setMinYearBuilt("");
    setMaxYearBuilt("");
    setMaxDaysOnMarket("");
    setKeywords("");
    updateParams({
      minSqft: null,
      maxSqft: null,
      minYearBuilt: null,
      maxYearBuilt: null,
      maxDaysOnMarket: null,
      keywords: null,
    });
  };

  const currentStatus = searchParams.get("status");
  const statusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.label || "Status";

  const priceLabel =
    minPrice || maxPrice
      ? `$${minPrice || "0"} - ${maxPrice ? `$${maxPrice}` : "Any"}`
      : "Price";

  const bedsLabel = minBeds ? `${minBeds}+ Beds` : "Beds";
  const bathsLabel = minBaths ? `${minBaths}+ Baths` : "Baths";
  const typeLabel = propertyType || "Home Type";

  const moreActive =
    minSqft ||
    maxSqft ||
    minYearBuilt ||
    maxYearBuilt ||
    maxDaysOnMarket ||
    keywords;

  const dropdownStyle: CSSProperties = dropdownLeft === null
    ? { left: "50%", transform: "translateX(-50%)" }
    : { left: dropdownLeft, transform: "translateX(-50%)" };

  const renderStatusDropdown = () => (
    <div className="w-72 rounded-xl border border-border bg-surface p-4 text-sm shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-text-main/70">
        <span className="font-semibold uppercase tracking-wider">Status</span>
        <button onClick={clearStatus} className="text-orange-500">
          Clear
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              updateParams({ status: opt.value });
              setActiveFilter(null);
            }}
            className={`rounded px-2 py-1 text-left transition ${
              currentStatus === opt.value
                ? "bg-orange-500 text-white"
                : "hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPriceDropdown = () => (
    <div className="w-72 rounded-xl border border-border bg-surface p-4 text-sm shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-text-main/70">
        <span className="font-semibold uppercase tracking-wider">Price</span>
        <button onClick={clearPrice} className="text-orange-500">
          Clear
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-main/70">
          Min price
          <select
            className="w-full rounded border border-border bg-white/5 px-2 py-1"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          >
            {PRICE_OPTIONS.map((opt) => (
              <option key={opt.value || 'min-none'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-main/70">
          Max price
          <select
            className="w-full rounded border border-border bg-white/5 px-2 py-1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          >
            {[{ label: "No max", value: "" }, ...PRICE_OPTIONS.slice(1)].map((opt) => (
              <option key={opt.value || 'max-none'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="mt-3 w-full rounded-full bg-orange-500 py-1.5 text-white"
        onClick={() => {
          updateParams({ minPrice, maxPrice });
          setActiveFilter(null);
        }}
      >
        Apply
      </button>
    </div>
  );

  const renderBedsDropdown = () => (
    <div className="w-72 rounded-xl border border-border bg-surface p-4 text-sm shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-text-main/70">
        <span className="font-semibold uppercase tracking-wider">Bedrooms</span>
        <button onClick={clearBeds} className="text-orange-500">
          Clear
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {BEDS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setMinBeds(opt.value === "0" ? "" : opt.value);
              updateParams({ beds: opt.value === "0" ? null : opt.value });
              setActiveFilter(null);
            }}
            className={`rounded border border-border px-2 py-1 text-center text-sm ${
              minBeds === opt.value ? "bg-orange-500 text-white" : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBathsDropdown = () => (
    <div className="w-72 rounded-xl border border-border bg-surface p-4 text-sm shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-text-main/70">
        <span className="font-semibold uppercase tracking-wider">Bathrooms</span>
        <button onClick={clearBaths} className="text-orange-500">
          Clear
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {BATHS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setMinBaths(opt.value === "0" ? "" : opt.value);
              updateParams({ baths: opt.value === "0" ? null : opt.value });
              setActiveFilter(null);
            }}
            className={`rounded border border-border px-2 py-1 text-center text-sm ${
              minBaths === opt.value ? "bg-orange-500 text-white" : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPropertyTypeDropdown = () => (
    <div className="w-72 rounded-xl border border-border bg-surface p-4 text-sm shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-text-main/70">
        <span className="font-semibold uppercase tracking-wider">Home Type</span>
        <button onClick={clearPropertyType} className="text-orange-500">
          Clear
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {PROPERTY_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setPropertyType(opt.value);
              updateParams({ propertyType: opt.value });
              setActiveFilter(null);
            }}
            className={`rounded px-2 py-1 text-left transition ${
              propertyType === opt.value
                ? "bg-orange-500 text-white"
                : "hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMoreDropdown = () => (
    <div className="w-[90vw] max-w-2xl rounded-2xl border border-border bg-surface p-6 text-sm shadow-2xl">
      <div className="mb-4 flex items-center justify-between text-xs text-text-main/70">
        <span className="font-semibold uppercase tracking-wider">Advanced Filters</span>
        <button onClick={clearMore} className="text-orange-500">
          Clear
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-main/60">
            Size &amp; Age
          </h4>
          <label className="flex flex-col gap-1 text-xs text-text-main/70">
            Square Feet
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-1/2 rounded border border-border bg-white/5 px-2 py-1"
                value={minSqft}
                onChange={(e) => setMinSqft(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-1/2 rounded border border-border bg-white/5 px-2 py-1"
                value={maxSqft}
                onChange={(e) => setMaxSqft(e.target.value)}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-main/70">
            Year Built
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-1/2 rounded border border-border bg-white/5 px-2 py-1"
                value={minYearBuilt}
                onChange={(e) => setMinYearBuilt(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-1/2 rounded border border-border bg-white/5 px-2 py-1"
                value={maxYearBuilt}
                onChange={(e) => setMaxYearBuilt(e.target.value)}
              />
            </div>
          </label>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-main/60">
            Amenities &amp; Comfort
          </h4>
          <label className="flex flex-col gap-1 text-xs text-text-main/70">
            Keywords
            <input
              type="text"
              placeholder="Pool, fixer upper..."
              className="rounded border border-border bg-white/5 px-2 py-1"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-main/60">
            Timeline &amp; Costs
          </h4>
          <label className="flex flex-col gap-1 text-xs text-text-main/70">
            Days on Market
            <select
              className="rounded border border-border bg-white/5 px-2 py-1"
              value={maxDaysOnMarket}
              onChange={(e) => setMaxDaysOnMarket(e.target.value)}
            >
              {DOM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end">
        <button
          className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white"
          onClick={() => {
            updateParams({
              minSqft,
              maxSqft,
              minYearBuilt,
              maxYearBuilt,
              maxDaysOnMarket,
              keywords,
            });
            setActiveFilter(null);
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <div ref={barRef} className="relative w-full">
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-3">
        <div className="w-full sm:w-1/3 md:w-1/3 lg:w-1/3 sm:ml-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-surface px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-text-main/60 sm:inline">
              Search
            </span>
            <input
              type="text"
              className="w-full border-none bg-transparent p-0 text-xs text-text-main placeholder:text-text-main/40 focus:outline-none"
              placeholder="City, ZIP, Address"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            ref={(el) => (chipRefs.current.status = el)}
            type="button"
            onClick={() => openFilter("status", "status")}
            className={`${chipBase} ${currentStatus ? chipActive : chipInactive}`}
          >
            {statusLabel}
          </button>
          <button
            ref={(el) => (chipRefs.current.price = el)}
            type="button"
            onClick={() => openFilter("price", "price")}
            className={`${chipBase} ${minPrice || maxPrice ? chipActive : chipInactive}`}
          >
            {priceLabel}
          </button>
          <button
            ref={(el) => (chipRefs.current.beds = el)}
            type="button"
            onClick={() => openFilter("beds", "beds")}
            className={`${chipBase} ${minBeds ? chipActive : chipInactive}`}
          >
            {bedsLabel}
          </button>
          <button
            ref={(el) => (chipRefs.current.baths = el)}
            type="button"
            onClick={() => openFilter("baths", "baths")}
            className={`${chipBase} ${minBaths ? chipActive : chipInactive}`}
          >
            {bathsLabel}
          </button>
          <button
            ref={(el) => (chipRefs.current.propertyType = el)}
            type="button"
            onClick={() => openFilter("propertyType", "propertyType")}
            className={`${chipBase} ${propertyType ? chipActive : chipInactive}`}
          >
            {typeLabel}
          </button>
          <button
            ref={(el) => (chipRefs.current.more = el)}
            type="button"
            onClick={() => openFilter("more", "more")}
            className={`${chipBase} ${moreActive ? chipActive : chipInactive}`}
          >
            More
          </button>
        </div>
      </div>

      {activeFilter && (
        <div
          className="absolute left-0 top-full z-50 mt-2"
          style={dropdownStyle}
        >
          {activeFilter === "status" && renderStatusDropdown()}
          {activeFilter === "price" && renderPriceDropdown()}
          {activeFilter === "beds" && renderBedsDropdown()}
          {activeFilter === "baths" && renderBathsDropdown()}
          {activeFilter === "propertyType" && renderPropertyTypeDropdown()}
          {activeFilter === "more" && renderMoreDropdown()}
        </div>
      )}
    </div>
  );
}
