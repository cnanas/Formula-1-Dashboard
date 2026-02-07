"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useSidebar } from "@/providers/sidebar-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTitleProvider } from "@/providers/page-title-provider";
import { DashboardEditProvider } from "@/providers/dashboard-edit-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <DashboardEditProvider>
      <PageTitleProvider>
        <TooltipProvider>
          <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:block">
              <Sidebar />
            </div>

            {/* Main content */}
            <main
              className={cn(
                "flex-1 transition-all duration-300",
                collapsed ? "md:ml-16" : "md:ml-64"
              )}
            >
              <Topbar />
              <div className="p-4 md:p-6">{children}</div>
            </main>
          </div>
        </TooltipProvider>
      </PageTitleProvider>
    </DashboardEditProvider>
  );
}
