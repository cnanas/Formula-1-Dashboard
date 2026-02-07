"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type NavigationMode = "sidebar" | "bottom";

interface NavigationModeContextType {
  mode: NavigationMode;
  setMode: (mode: NavigationMode) => void;
  toggleMode: () => void;
  mounted: boolean;
}

// Default context value for SSR and initial render
const defaultContextValue: NavigationModeContextType = {
  mode: "bottom",
  setMode: () => {},
  toggleMode: () => {},
  mounted: false,
};

const NavigationModeContext = createContext<NavigationModeContextType>(defaultContextValue);

const STORAGE_KEY = "f1dash_nav_mode";

export function NavigationModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<NavigationMode>("bottom");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved preference
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "bottom" || stored === "sidebar") {
        setModeState(stored);
      }
    } catch {
      // Ignore storage errors
    }
    setMounted(true);
  }, []);

  const setMode = useCallback((newMode: NavigationMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
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
