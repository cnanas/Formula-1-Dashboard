"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface PageTitleContextType {
  /** The dynamic page title (e.g., "Monaco Grand Prix - Race") */
  dynamicTitle: string | null;
  /** Optional subtitle for additional context */
  subtitle: string | null;
  /** Set the dynamic title and optional subtitle */
  setPageTitle: (title: string | null, subtitle?: string | null) => void;
  /** Clear the dynamic title */
  clearPageTitle: () => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(
  undefined
);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);

  const setPageTitle = useCallback(
    (title: string | null, sub?: string | null) => {
      setDynamicTitle(title);
      setSubtitle(sub ?? null);
    },
    []
  );

  const clearPageTitle = useCallback(() => {
    setDynamicTitle(null);
    setSubtitle(null);
  }, []);

  return (
    <PageTitleContext.Provider
      value={{ dynamicTitle, subtitle, setPageTitle, clearPageTitle }}
    >
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }
  return context;
}
