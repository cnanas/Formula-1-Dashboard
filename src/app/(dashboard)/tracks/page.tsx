"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TRACK_SLUGS, TRACK_DISPLAY_NAMES } from "@/lib/constants/track-layouts";
import { TrackOutline } from "@/components/shared/track-outline";
import { usePageTitle } from "@/providers/page-title-provider";
import { useEffect } from "react";

export default function TracksIndexPage() {
  const { setPageTitle, clearPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("Track History", "Circuits & stats");
    return () => clearPageTitle();
  }, [setPageTitle, clearPageTitle]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Track History</h1>
        <p className="text-muted-foreground mt-1">
          Circuit info, past winners, and stats for each F1 track.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TRACK_SLUGS.map((slug) => (
          <Link key={slug} href={`/tracks/${slug}`}>
            <Card className="h-full hover:bg-accent/50 transition-colors">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <TrackOutline
                    circuitShortName={TRACK_DISPLAY_NAMES[slug] ?? slug}
                    className="h-8 w-14"
                    strokeWidth={2}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">
                    {TRACK_DISPLAY_NAMES[slug] ?? slug}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    View stats & past winners
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
