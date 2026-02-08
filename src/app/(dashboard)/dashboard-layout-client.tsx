"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DynamicBackground } from "@/components/layout/dynamic-background";
import { BottomNav, DesktopBottomNav } from "@/components/layout/bottom-nav";
import { WelcomeTeamModal } from "@/components/dashboard/welcome-team-modal";
import { useSidebar } from "@/providers/sidebar-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTitleProvider } from "@/providers/page-title-provider";
import { DashboardEditProvider } from "@/providers/dashboard-edit-provider";
import { CircuitThemeProvider } from "@/providers/circuit-theme-provider";
import { NavigationModeProvider, useNavigationMode } from "@/providers/navigation-mode-provider";
import { SeasonProvider } from "@/providers/season-provider";
import { TeamFilterProvider } from "@/providers/team-filter-provider";
import type { NavigationMode } from "@/providers/navigation-mode-provider";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const { mode } = useNavigationMode();

  return (
    <>
      <DynamicBackground />
      <WelcomeTeamModal />

      <div className="relative flex min-h-screen min-w-0 overflow-x-hidden">
        {mode === "sidebar" && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        <main
          className={cn(
            "flex-1 min-w-0 overflow-x-hidden transition-all duration-300",
            mode === "sidebar" && (collapsed ? "md:ml-16" : "md:ml-64"),
            mode === "bottom" && "pb-24"
          )}
        >
          <Topbar />
          <div className="px-2 py-4 sm:px-3 md:px-4 md:py-6">{children}</div>
        </main>
      </div>

      {mode === "bottom" && (
        <>
          <BottomNav />
          <DesktopBottomNav />
        </>
      )}
    </>
  );
}

export function DashboardLayoutClient({
  children,
  initialNavMode,
}: {
  children: React.ReactNode;
  initialNavMode?: NavigationMode | null;
}) {
  return (
    <SeasonProvider>
      <TeamFilterProvider>
        <CircuitThemeProvider>
          <NavigationModeProvider initialMode={initialNavMode}>
            <DashboardEditProvider>
            <PageTitleProvider>
              <TooltipProvider>
                <DashboardContent>{children}</DashboardContent>
              </TooltipProvider>
            </PageTitleProvider>
            </DashboardEditProvider>
          </NavigationModeProvider>
        </CircuitThemeProvider>
      </TeamFilterProvider>
    </SeasonProvider>
  );
}
