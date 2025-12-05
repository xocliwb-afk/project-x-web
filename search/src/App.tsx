import { useState } from "react";
import "./App.css";

type TabKey = "buy" | "sell" | "rent" | "my-home";

const TABS: { key: TabKey; label: string }[] = [
  { key: "buy", label: "Buy" },
  { key: "sell", label: "Sell" },
  { key: "rent", label: "Rent" },
  { key: "my-home", label: "My Home" },
];

const FILTER_CHIPS = [
  "Price",
  "Beds & Baths",
  "Home type",
  "More",
];

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("buy");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo + brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-semibold tracking-tight">
              PX
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Project X
              </span>
              <span className="text-xs text-slate-500">
                White-label home search
              </span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="hidden sm:flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "px-3 py-1.5 text-xs font-medium rounded-full transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Filters + Search results layout */}
      <main className="mx-auto max-w-6xl px-4 py-4 space-y-4">
        {/* Filter chips row */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 px-3 py-2 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-300 transition"
              >
                <span>{chip}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            More filters
          </button>
        </section>

        {/* Main content: list + map layout */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Results list */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                Sample homes near Grand Rapids
              </h2>
              <span className="text-xs text-slate-500">
                Static demo data – API wiring comes later
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <article
                  key={n}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="h-32 bg-slate-200 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-tr from-slate-300 via-slate-200 to-slate-100 group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        $4{n}5,000
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        For {activeTab === "rent" ? "rent" : "sale"}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">
                      3 bd · 2 ba · 1,6{n}0 sqft
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Sample address · Grand Rapids, MI
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Tap for details – this will open the listing drawer in the future app.
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900/95 text-slate-100 p-3 flex flex-col gap-3 min-h-[260px]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight">
                Map preview
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                Placeholder
              </span>
            </div>
            <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/40 flex items-center justify-center text-[11px] text-slate-300">
              Interactive map goes here (Leaflet / Mapbox / Google Maps) with
              synced pins from the API.
            </div>
            <p className="text-[11px] text-slate-400">
              This layout is intentionally simple and white-label friendly so we can
              re-skin it per brokerage later.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
