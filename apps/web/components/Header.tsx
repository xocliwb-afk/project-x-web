"use client";

import styles from "./Header.module.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import SearchFiltersBar, { SortButton } from "@/components/SearchFiltersBar";
import { useLeadModalStore } from "@/stores/useLeadModalStore";

export default function Header() {
  const { mapSide, paneDominance, setMapSide, setPaneDominance } = useTheme();
  const pathname = usePathname();
  const isSearchPage = pathname?.startsWith("/search");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  const openLeadModal = useLeadModalStore((s) => s.open);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search" },
    { label: "Buy Smarter", href: "/buy" },
    { label: "Sell for More", href: "/sell" },
    { label: "Build", href: "/build" },
    { label: "Neighborhoods", href: "/neighborhoods" },
    { label: "About", href: "/about" },
  ];

  const isActive = (href: string) => pathname === href;

  const navLinkClass = (href: string) =>
    [styles.navLink, isActive(href) ? styles.isActive : ""].join(" ").trim();

  const pillClasses = (active: boolean) =>
    [
      "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
      active
        ? "bg-primary text-white border-primary"
        : "border-white/70 text-slate-800 bg-white/80 hover:bg-white",
    ].join(" ");

  return (
    <header className="flex shrink-0 flex-col">
      <nav className={styles.topNav}>
        <div className={styles.topNavInner}>
          <Link href="/" className={styles.topNavBrand} onClick={() => setMobileOpen(false)}>
            <Image
              src="/assets/img/bw-home-group-logo.webp"
              alt="Brandon Wilcox Home Group"
              width={44}
              height={44}
              className={styles.topNavLogo}
              priority
            />
            <span className={styles.topNavBrandText}>Brandon Wilcox Home Group</span>
          </Link>

          <div className={styles.topNavLinks}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <button type="button" onClick={() => openLeadModal()} className={styles.navLink}>
              Contact
            </button>
          </div>

          <button
            type="button"
            className={styles.topNavToggle}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`${styles.mobileNav} ${mobileOpen ? styles.mobileNavOpen : ""}`}>
        <div className={styles.mobileNavBackdrop} onClick={() => setMobileOpen(false)} />
        <div className={styles.mobileNavInner}>
          <button
            type="button"
            className={styles.mobileNavClose}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
          <ul className={styles.mobileNavList}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={navLinkClass(item.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={styles.navLink}
                onClick={() => {
                  openLeadModal();
                  setMobileOpen(false);
                }}
              >
                Contact
              </button>
            </li>
          </ul>
        </div>
      </div>

      {isSearchPage && (
        <div className="w-full border-b border-border bg-primary-accent py-2 text-slate-900">
          <div className="mx-auto flex w-full max-w-[1920px] flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-6">
            <div className="flex-1 min-w-[320px]">
              <SearchFiltersBar />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <SortButton />
              <button
                type="button"
                onClick={() => openLeadModal()}
                className="h-10 rounded-full bg-white px-4 text-sm font-semibold text-primary shadow-sm transition hover:brightness-95"
              >
                Plan a tour
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMapMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-full border border-white/60 bg-white/80 text-primary transition hover:bg-white"
                  aria-label="Map layout controls"
                >
                  <span className="block h-0.5 w-4 bg-primary" />
                  <span className="block h-0.5 w-4 bg-primary" />
                  <span className="block h-0.5 w-4 bg-primary" />
                </button>
                {mapMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
                    <div className="mb-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Map location
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={pillClasses(mapSide === "left")}
                          onClick={() => setMapSide("left")}
                        >
                          Left
                        </button>
                        <button
                          type="button"
                          className={pillClasses(mapSide === "right")}
                          onClick={() => setMapSide("right")}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
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
        </div>
      )}
    </header>
  );
}
