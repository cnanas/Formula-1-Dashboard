"use client";

import Link from "next/link";
import { Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStatus } from "@/hooks/use-session-status";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";

export default function DashboardHome() {
  const { isLive } = useSessionStatus();

  return (
    <div className="space-y-6">
      {/* Live session banner */}
      {isLive && (
        <Link href="/live">
          <Card className="border-red-500/50 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              <span className="font-medium">
                A session is currently live! Click to view live timing and
                telemetry.
              </span>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Widget Grid */}
      <DashboardGrid />
    </div>
  );
}
