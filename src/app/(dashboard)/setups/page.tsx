"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Settings2, ChevronRight, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrackOutline } from "@/components/shared/track-outline";
import { SetupDetailSheet } from "@/components/setups/setup-detail-sheet";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { usePageTitle } from "@/providers/page-title-provider";
import { CIRCUIT_THEMES } from "@/lib/constants/circuits";
import type { SetupsResponse } from "@/types/setups";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Order tracks by calendar order for consistent display
const TRACK_ORDER = [
  "bahrain", "jeddah", "melbourne", "shanghai", "miami", "imola", "monaco",
  "barcelona", "montreal", "spielberg", "silverstone", "spa", "budapest",
  "zandvoort", "monza", "baku", "singapore", "austin", "mexico", "interlagos",
  "lasvegas", "losail", "abudhabi",
];

export default function SetupsPage() {
  const { setPageTitle, clearPageTitle } = usePageTitle();
  const [selectedTrack, setSelectedTrack] = useState<{
    circuitKey: string;
    trackName: string;
    setups: SetupsResponse["byTrack"][string];
  } | null>(null);

  const { data, error, isLoading } = useSWR<SetupsResponse>("/api/setups", fetcher, {
    revalidateOnFocus: false,
  });

  const handleTrackClick = (circuitKey: string, trackName: string) => {
    const setups = data?.byTrack[circuitKey] ?? [];
    if (setups.length > 0) {
      setSelectedTrack({ circuitKey, trackName, setups });
    }
  };

  // Sort tracks by calendar order
  useEffect(() => {
    if (data) {
      setPageTitle("F1 25 Game Setups", "EA Sports F1");
    }
    return () => clearPageTitle();
  }, [data, setPageTitle, clearPageTitle]);

  const sortedTracks = data
    ? Object.entries(data.byTrack).sort(
        ([a], [b]) =>
          (TRACK_ORDER.indexOf(a) === -1 ? 999 : TRACK_ORDER.indexOf(a)) -
          (TRACK_ORDER.indexOf(b) === -1 ? 999 : TRACK_ORDER.indexOf(b))
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">F1 25 Game Setups</h1>
        <p className="text-muted-foreground mt-1">
          Car setups for EA Sports F1 25 from Theorycrafted and gruhnd. Tap a
          track to view.
        </p>
      </div>

      {isLoading && <PageSkeleton />}

      {error && (
        <EmptyState
          icon={Settings2}
          title="Failed to load setups"
          description="Check your connection and try again."
        />
      )}

      {!isLoading && !error && sortedTracks.length === 0 && (
        <EmptyState
          icon={Gamepad2}
          title="No setups available"
          description="Setup data could not be loaded from the sources."
        />
      )}

      {!isLoading && !error && sortedTracks.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTracks.map(([circuitKey, setups]) => {
            const trackName = setups[0]?.trackName ?? circuitKey;
            const theme = CIRCUIT_THEMES[circuitKey] ?? CIRCUIT_THEMES.bahrain;
            return (
              <Card
                key={circuitKey}
                className="cursor-pointer transition-colors hover:bg-muted/50 active:scale-[0.99]"
                onClick={() => handleTrackClick(circuitKey, trackName)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}20` }}
                  >
                    <TrackOutline
                      circuitShortName={circuitKey}
                      className="w-7 h-7"
                      strokeColor={theme.primaryColor}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{trackName}</p>
                    <p className="text-sm text-muted-foreground">
                      {setups.length} setup{setups.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTrack && (
        <SetupDetailSheet
          trackName={selectedTrack.trackName}
          circuitKey={selectedTrack.circuitKey}
          setups={selectedTrack.setups}
          open={!!selectedTrack}
          onOpenChange={(open) => !open && setSelectedTrack(null)}
        />
      )}
    </div>
  );
}
