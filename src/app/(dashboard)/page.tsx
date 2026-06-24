"use client";

import Link from "next/link";
import { Radio, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionStatus } from "@/hooks/use-session-status";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { RaceStartLightsBanner } from "@/components/dashboard/race-start-lights-banner";
import { F1_APPLE_TV_US_URL } from "@/lib/constants/watch";

export default function DashboardHome() {
  const { isLive } = useSessionStatus();

  return (
    <div className="space-y-6">
      {/* Race start lights animation */}
      <RaceStartLightsBanner />

      {/* Live session banner */}
      {isLive && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 shrink-0 text-red-500 animate-pulse" />
              <span className="font-medium">
                A session is currently live! View live timing or watch on Apple
                TV (US).
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" className="border-red-500/50" asChild>
                <Link href="/live">Live timing</Link>
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                asChild
              >
                <a
                  href={F1_APPLE_TV_US_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Watch on Apple TV (US)"
                >
                  <Play className="h-4 w-4" />
                  Watch now
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widget Grid */}
      <DashboardGrid />
    </div>
  );
}
