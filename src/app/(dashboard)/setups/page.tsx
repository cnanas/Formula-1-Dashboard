"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Settings2, ChevronRight, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrackOutline } from "@/components/shared/track-outline";
import { SetupDetailSheet } from "@/components/setups/setup-detail-sheet";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { usePageTitle } from "@/providers/page-title-provider";
import { CIRCUIT_THEMES } from "@/lib/constants/circuits";
import type { SetupsResponse, SetupGame, GameSetup } from "@/types/setups";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TRACK_ORDER = [
  "bahrain", "jeddah", "melbourne", "shanghai", "miami", "imola", "monaco",
  "barcelona", "montreal", "spielberg", "silverstone", "spa", "budapest",
  "zandvoort", "monza", "madrid", "baku", "singapore", "austin", "mexico",
  "interlagos", "lasvegas", "losail", "abudhabi",
];

const GAME_LABELS: Record<SetupGame, string> = {
  f125: "F1 25",
  f126: "F1 26",
};

export default function SetupsPage() {
  const { setPageTitle, clearPageTitle } = usePageTitle();
  const [selectedGame, setSelectedGame] = useState<SetupGame>("f126");
  const [selectedTrack, setSelectedTrack] = useState<{
    circuitKey: string;
    trackName: string;
    setups: SetupsResponse["byTrack"][string];
  } | null>(null);

  const { data, error, isLoading } = useSWR<SetupsResponse>("/api/setups", fetcher, {
    revalidateOnFocus: false,
  });

  const filteredByTrack = useMemo<Record<string, GameSetup[]>>(() => {
    if (!data?.byTrack) return {};
    return Object.fromEntries(
      Object.entries(data.byTrack)
        .map(([key, setups]) => [key, setups.filter((s) => s.game === selectedGame)])
        .filter(([, setups]) => (setups as GameSetup[]).length > 0)
    );
  }, [data, selectedGame]);

  const handleTrackClick = (circuitKey: string, trackName: string) => {
    const setups = filteredByTrack[circuitKey] ?? [];
    if (setups.length > 0) {
      setSelectedTrack({ circuitKey, trackName, setups });
    }
  };

  useEffect(() => {
    if (data) {
      setPageTitle(`${GAME_LABELS[selectedGame]} Game Setups`, "EA Sports F1");
    }
    return () => clearPageTitle();
  }, [data, selectedGame, setPageTitle, clearPageTitle]);

  // Close sheet when game changes
  useEffect(() => {
    setSelectedTrack(null);
  }, [selectedGame]);

  const sortedTracks = Object.entries(filteredByTrack).sort(
    ([a], [b]) =>
      (TRACK_ORDER.indexOf(a) === -1 ? 999 : TRACK_ORDER.indexOf(a)) -
      (TRACK_ORDER.indexOf(b) === -1 ? 999 : TRACK_ORDER.indexOf(b))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {GAME_LABELS[selectedGame]} Game Setups
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedGame === "f126"
              ? "Car setups for EA Sports F1 26 from Theorycrafted. Tap a track to view."
              : "Car setups for EA Sports F1 25 from Theorycrafted and gruhnd. Tap a track to view."}
          </p>
        </div>

        {/* Game filter toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          {(["f126", "f125"] as SetupGame[]).map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedGame === game
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {GAME_LABELS[game]}
            </button>
          ))}
        </div>
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
          description={`Setup data for ${GAME_LABELS[selectedGame]} could not be loaded.`}
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
