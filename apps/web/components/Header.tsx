"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import SearchFiltersBar from "@/components/SearchFiltersBar";
import { useLeadModalStore } from "@/stores/useLeadModalStore";

export default function Header() {
  const { mapSide, paneDominance, setMapSide, setPaneDominance } = useTheme();
  const pathname = usePathname();
  const isSearchPage = pathname?.startsWith("/search");
  const [menuOpen, setMenuOpen] = useState(false);
  const openLeadModal = useLeadModalStore((s) => s.open);

  const navLinkClasses = (active: boolean) =>
    [
      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
      active
        ? "bg-primary-accent text-primary"
        : "text-white/80 hover:text-white hover:bg-white/10",
    ].join(" ");

  const pillClasses = (active: boolean) =>
    [
      "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
      active
        ? "bg-primary text-white border-primary"
        : "border-slate-200 text-slate-600 hover:bg-slate-100",
    ].join(" ");

  return (
    <header className="z-40 flex shrink-0 flex-col border-b border-border bg-primary text-white shadow-sm transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-3 sm:px-6 lg:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-accent text-[11px] font-semibold tracking-[0.12em] text-primary">
              PX
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">
                Project X
              </div>
              <div className="text-xs font-medium text-white/90">
                White-Label Search
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs">
            <Link href="/" className={navLinkClasses(pathname === "/")}>
              Overview
            </Link>
            <Link
              href="/search"
              className={navLinkClasses(isSearchPage ?? false)}
            >
              Search Prototype
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openLeadModal()}
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:brightness-95 md:inline-flex"
          >
            Plan a tour
          </button>
          <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-1 rounded px-2 py-1 transition hover:bg-white/10 focus:outline-none"
            aria-label="Open layout controls"
          >
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </button>

          {menuOpen && (
            <div className="absolute right-4 top-12 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-slate-100 shadow-xl">
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Map location
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={pillClasses(mapSide === "left")}
                    onClick={() => setMapSide("left")}
                  >
                    Map left
                  </button>
                  <button
                    type="button"
                    className={pillClasses(mapSide === "right")}
                    onClick={() => setMapSide("right")}
                  >
                    Map right
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Panel size
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={pillClasses(paneDominance === "left")}
                    onClick={() => setPaneDominance("left")}
                  >
                    Left 60%
                  </button>
                  <button
                    type="button"
                    className={pillClasses(paneDominance === "right")}
                    onClick={() => setPaneDominance("right")}
                  >
                    Right 60%
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {isSearchPage && (
        <div className="w-full border-t border-border bg-primary-accent py-2 text-slate-900">
          <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-6">
            <SearchFiltersBar />
          </div>
        </div>
      )}
    </header>
  );
}
