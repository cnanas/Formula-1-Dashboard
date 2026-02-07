"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CircuitTheme, DEFAULT_THEME, getCircuitTheme, getTeamColors, TEAM_COLORS } from "@/lib/constants/circuits";

type ThemeMode = "circuit" | "team" | "custom" | "default";

interface CircuitThemeContextType {
  theme: CircuitTheme;
  themeMode: ThemeMode;
  selectedTeam: string | null;
  setCircuitTheme: (circuitName: string) => void;
  setTeamTheme: (teamName: string) => void;
  setCustomTheme: (primary: string, secondary: string, accent: string) => void;
  resetToDefault: () => void;
  availableTeams: string[];
}

const CircuitThemeContext = createContext<CircuitThemeContextType | undefined>(undefined);

const STORAGE_KEY = "f1dash_theme_preference";

interface StoredThemePreference {
  mode: ThemeMode;
  circuitName?: string;
  teamName?: string;
  customColors?: { primary: string; secondary: string; accent: string };
}

export function CircuitThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<CircuitTheme>(DEFAULT_THEME);
  const [themeMode, setThemeMode] = useState<ThemeMode>("default");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Load saved preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const preference: StoredThemePreference = JSON.parse(stored);
        if (preference.mode === "team" && preference.teamName) {
          const colors = getTeamColors(preference.teamName);
          setTheme({
            ...DEFAULT_THEME,
            id: `team-${preference.teamName}`,
            name: preference.teamName,
            primaryColor: colors.primary,
            secondaryColor: colors.secondary,
            accentColor: colors.accent,
          });
          setThemeMode("team");
          setSelectedTeam(preference.teamName);
        } else if (preference.mode === "circuit" && preference.circuitName) {
          setTheme(getCircuitTheme(preference.circuitName));
          setThemeMode("circuit");
        } else if (preference.mode === "custom" && preference.customColors) {
          setTheme({
            ...DEFAULT_THEME,
            id: "custom",
            name: "Custom Theme",
            primaryColor: preference.customColors.primary,
            secondaryColor: preference.customColors.secondary,
            accentColor: preference.customColors.accent,
          });
          setThemeMode("custom");
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const savePreference = useCallback((preference: StoredThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setCircuitTheme = useCallback((circuitName: string) => {
    const newTheme = getCircuitTheme(circuitName);
    setTheme(newTheme);
    setThemeMode("circuit");
    setSelectedTeam(null);
    savePreference({ mode: "circuit", circuitName });
  }, [savePreference]);

  const setTeamTheme = useCallback((teamName: string) => {
    const colors = getTeamColors(teamName);
    setTheme({
      ...DEFAULT_THEME,
      id: `team-${teamName}`,
      name: teamName,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
    });
    setThemeMode("team");
    setSelectedTeam(teamName);
    savePreference({ mode: "team", teamName });
  }, [savePreference]);

  const setCustomTheme = useCallback((primary: string, secondary: string, accent: string) => {
    setTheme({
      ...DEFAULT_THEME,
      id: "custom",
      name: "Custom Theme",
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
    });
    setThemeMode("custom");
    setSelectedTeam(null);
    savePreference({ mode: "custom", customColors: { primary, secondary, accent } });
  }, [savePreference]);

  const resetToDefault = useCallback(() => {
    setTheme(DEFAULT_THEME);
    setThemeMode("default");
    setSelectedTeam(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const availableTeams = Object.keys(TEAM_COLORS);

  return (
    <CircuitThemeContext.Provider
      value={{
        theme,
        themeMode,
        selectedTeam,
        setCircuitTheme,
        setTeamTheme,
        setCustomTheme,
        resetToDefault,
        availableTeams,
      }}
    >
      {children}
    </CircuitThemeContext.Provider>
  );
}

export function useCircuitTheme() {
  const context = useContext(CircuitThemeContext);
  if (!context) {
    throw new Error("useCircuitTheme must be used within a CircuitThemeProvider");
  }
  return context;
}
