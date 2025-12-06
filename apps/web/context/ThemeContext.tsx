"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type MapSide = "left" | "right";

interface ThemeContextType {
  mapSide: MapSide;
  setMapSide: (side: MapSide) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mapSide, setMapSide] = useState<MapSide>("left");

  return (
    <ThemeContext.Provider value={{ mapSide, setMapSide }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}