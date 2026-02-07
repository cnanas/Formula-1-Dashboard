"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface DashboardEditContextType {
  /** Whether the dashboard is in edit mode */
  isEditing: boolean;
  /** Toggle edit mode */
  toggleEditing: () => void;
  /** Set edit mode directly */
  setEditing: (editing: boolean) => void;
  /** Whether the edit button should be shown (only on dashboard page) */
  showEditButton: boolean;
  /** Set whether the edit button should be shown */
  setShowEditButton: (show: boolean) => void;
}

const DashboardEditContext = createContext<DashboardEditContextType | undefined>(
  undefined
);

export function DashboardEditProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showEditButton, setShowEditButton] = useState(false);

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const setEditing = useCallback((editing: boolean) => {
    setIsEditing(editing);
  }, []);

  return (
    <DashboardEditContext.Provider
      value={{
        isEditing,
        toggleEditing,
        setEditing,
        showEditButton,
        setShowEditButton,
      }}
    >
      {children}
    </DashboardEditContext.Provider>
  );
}

export function useDashboardEdit() {
  const context = useContext(DashboardEditContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardEdit must be used within a DashboardEditProvider"
    );
  }
  return context;
}
