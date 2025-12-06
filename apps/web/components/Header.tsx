"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import SearchFiltersBar from "./SearchFiltersBar";

export default function Header() {
  const { mapSide, setMapSide } = useTheme();
  const pathname = usePathname();
  const isSearchPage = pathname?.startsWith("/search");

  return (
    <header className="z-40 flex shrink-0 flex-col border-b border-border bg-primary text-white shadow-sm transition-colors duration-300">
      {/* TOP ROW: Logo & Controls */}
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-3 sm:px-6 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-accent text-[11px] font-semibold tracking-tight text-primary">
            PX
          </div>
          <div className="leading-tight">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
              Project X
            </div>
            <div className="text-xs font-medium">White-Label Search</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 text-xs">
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-primary-accent transition-colors"
            >
              Overview
            </Link>
            <Link
              href="/search"
              className="rounded-full bg-primary-accent px-3 py-1 text-primary transition-colors hover:bg-opacity-90"
            >
              Search Prototype
            </Link>
          </nav>

          <div className="hidden items-center gap-1 rounded-full bg-white/10 px-1 py-1 sm:flex">
            <span className="px-2 text-[10px] uppercase tracking-wider text-white/50">
              Map
            </span>
            <button
              onClick={() => setMapSide("left")}
              className={`rounded-full px-2 py-0.5 transition-colors ${
                mapSide === "left"
                  ? "bg-primary-accent text-primary"
                  : "hover:bg-white/20"
              }`}
            >
              Left
            </button>
            <button
              onClick={() => setMapSide("right")}
              className={`rounded-full px-2 py-0.5 transition-colors ${
                mapSide === "right"
                  ? "bg-primary-accent text-primary"
                  : "hover:bg-white/20"
              }`}
            >
              Right
            </button>
          </div>
        </div>
      </div>

      {/* SECOND ROW: Search Bar (Only on Search Page) */}
      {isSearchPage && (
        <div className="w-full border-t border-white/10 bg-surface py-2 text-text-main">
          <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-6">
            <SearchFiltersBar />
          </div>
        </div>
      )}
    </header>
  );
}