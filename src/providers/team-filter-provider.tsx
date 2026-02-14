"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { normalizeTeamName } from "@/lib/constants/team-names";

const STORAGE_KEY = "f1dash_team_filter";

interface TeamFilterContextType {
  /** Selected team name (e.g. "McLaren") or null for no filter */
  selectedTeam: string | null;
  setSelectedTeam: (team: string | null) => void;
  clearTeamFilter: () => void;
}

const TeamFilterContext = createContext<TeamFilterContextType>({
  selectedTeam: null,
  setSelectedTeam: () => {},
  clearTeamFilter: () => {},
});

export function TeamFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeam, setSelectedTeamState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.length > 0) {
        setSelectedTeamState(normalizeTeamName(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const setSelectedTeam = useCallback((team: string | null) => {
    const normalizedTeam = team ? normalizeTeamName(team) : null;
    setSelectedTeamState(normalizedTeam);
    try {
      if (normalizedTeam) {
        localStorage.setItem(STORAGE_KEY, normalizedTeam);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }, []);

  const clearTeamFilter = useCallback(() => {
    setSelectedTeam(null);
  }, []);

  return (
    <TeamFilterContext.Provider
      value={{
        selectedTeam: mounted ? selectedTeam : null,
        setSelectedTeam,
        clearTeamFilter,
      }}
    >
      {children}
    </TeamFilterContext.Provider>
  );
}

export function useTeamFilter() {
  return useContext(TeamFilterContext);
}
