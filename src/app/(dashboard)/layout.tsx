"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DynamicBackground } from "@/components/layout/dynamic-background";
import { BottomNav, DesktopBottomNav } from "@/components/layout/bottom-nav";
import { useSidebar } from "@/providers/sidebar-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTitleProvider } from "@/providers/page-title-provider";
import { DashboardEditProvider } from "@/providers/dashboard-edit-provider";
import { CircuitThemeProvider } from "@/providers/circuit-theme-provider";
import { NavigationModeProvider, useNavigationMode } from "@/providers/navigation-mode-provider";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const { mode, mounted } = useNavigationMode();

  // Default to sidebar mode during SSR/initial render
  const effectiveMode = mounted ? mode : "sidebar";

  return (
    <>
      {/* Dynamic animated background */}
      <DynamicBackground />
      
      <div className="relative flex min-h-screen">
        {/* Sidebar - only shown in sidebar mode on desktop */}
        {effectiveMode === "sidebar" && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        {/* Main content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            effectiveMode === "sidebar" && (collapsed ? "md:ml-16" : "md:ml-64"),
            effectiveMode === "bottom" && "pb-24" // Add padding for bottom nav
          )}
        >
          <Topbar />
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>

      {/* Bottom navigation - shown in bottom mode */}
      {mounted && effectiveMode === "bottom" && (
        <>
          <BottomNav />
          <DesktopBottomNav />
        </>
      )}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CircuitThemeProvider>
      <NavigationModeProvider>
        <DashboardEditProvider>
          <PageTitleProvider>
            <TooltipProvider>
              <DashboardContent>{children}</DashboardContent>
            </TooltipProvider>
          </PageTitleProvider>
        </DashboardEditProvider>
      </NavigationModeProvider>
    </CircuitThemeProvider>
  );
}
