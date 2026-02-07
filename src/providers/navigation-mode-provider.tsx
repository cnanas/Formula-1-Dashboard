"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type NavigationMode = "sidebar" | "bottom";

interface NavigationModeContextType {
  mode: NavigationMode;
  setMode: (mode: NavigationMode) => void;
  toggleMode: () => void;
  mounted: boolean;
}

const defaultContextValue: NavigationModeContextType = {
  mode: "sidebar",
  setMode: () => {},
  toggleMode: () => {},
  mounted: true,
};

const NavigationModeContext = createContext<NavigationModeContextType>(defaultContextValue);

const STORAGE_KEY = "f1dash_nav_mode";
const COOKIE_NAME = "f1dash_nav_mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setNavModeCookie(mode: NavigationMode) {
  try {
    document.cookie = `${COOKIE_NAME}=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

export function NavigationModeProvider({
  children,
  initialMode,
}: {
  children: React.ReactNode;
  /** From server cookie so first paint matches saved preference (avoids sidebar flash on refresh) */
  initialMode?: NavigationMode | null;
}) {
  const [mode, setModeState] = useState<NavigationMode>(
    initialMode === "bottom" || initialMode === "sidebar" ? initialMode : "sidebar"
  );
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (initialMode != null) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "bottom" || stored === "sidebar") {
        setModeState(stored);
        setNavModeCookie(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }, [initialMode]);

  const setMode = useCallback((newMode: NavigationMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
      setNavModeCookie(newMode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "sidebar" ? "bottom" : "sidebar");
  }, [mode, setMode]);

  return (
    <NavigationModeContext.Provider value={{ mode, setMode, toggleMode, mounted }}>
      {children}
    </NavigationModeContext.Provider>
  );
}

export function useNavigationMode() {
  return useContext(NavigationModeContext);
}
