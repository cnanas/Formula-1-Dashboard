"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

// Default to 2025 since 2026 season hasn't started yet
// OpenF1 has data from 2023 onwards
const DEFAULT_SEASON = 2025;
const MIN_SEASON = 2023;
// Use a fixed max year to avoid hydration issues
// This should be updated at the start of each new year
const MAX_SEASON = 2026;

interface SeasonContextType {
  season: number;
  setSeason: (year: number) => void;
  availableSeasons: number[];
}

const SeasonContext = createContext<SeasonContextType>({
  season: DEFAULT_SEASON,
  setSeason: () => {},
  availableSeasons: [],
});

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeasonRaw] = useState(DEFAULT_SEASON);

  const availableSeasons = useMemo(() =>
    Array.from(
      { length: MAX_SEASON - MIN_SEASON + 1 },
      (_, i) => MAX_SEASON - i
    ),
    []
  );

  const setSeason = useCallback((year: number) => {
    if (year >= MIN_SEASON && year <= MAX_SEASON) {
      setSeasonRaw(year);
    }
  }, []);

  return (
    <SeasonContext.Provider value={{ season, setSeason, availableSeasons }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
