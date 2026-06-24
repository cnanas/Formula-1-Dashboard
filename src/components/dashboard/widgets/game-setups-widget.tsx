"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackOutline } from "@/components/shared/track-outline";
import { SetupDetailSheet } from "@/components/setups/setup-detail-sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { CIRCUIT_THEMES } from "@/lib/constants/circuits";
import { cn } from "@/lib/utils";
import type { GameSetup, SetupsResponse, SetupGame } from "@/types/setups";

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

function sortTracks(entries: [string, SetupsResponse["byTrack"][string]][]) {
  return [...entries].sort(
    ([a], [b]) =>
      (TRACK_ORDER.indexOf(a) === -1 ? 999 : TRACK_ORDER.indexOf(a)) -
      (TRACK_ORDER.indexOf(b) === -1 ? 999 : TRACK_ORDER.indexOf(b))
  );
}

export function GameSetupsWidget() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<SetupGame>("f126");
  const [selectedTrack, setSelectedTrack] = useState<{
    circuitKey: string;
    trackName: string;
    setups: SetupsResponse["byTrack"][string];
  } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const sortedTracks = useMemo(() => {
    return sortTracks(Object.entries(filteredByTrack));
  }, [filteredByTrack]);

  const filteredTracks = useMemo(() => {
    if (!search.trim()) return sortedTracks;
    const q = search.toLowerCase();
    return sortedTracks.filter(
      ([_, setups]) =>
        (setups[0]?.trackName ?? "").toLowerCase().includes(q) ||
        setups[0]?.track.toLowerCase().includes(q)
    );
  }, [sortedTracks, search]);

  // Default to first track when data loads or game changes
  const displayTrack = selectedTrack ?? (sortedTracks[0]
    ? {
        circuitKey: sortedTracks[0][0],
        trackName: sortedTracks[0][1][0]?.trackName ?? sortedTracks[0][0],
        setups: sortedTracks[0][1],
      }
    : null);

  const handleSelect = (circuitKey: string, trackName: string) => {
    const setups = filteredByTrack[circuitKey] ?? [];
    setSelectedTrack({ circuitKey, trackName, setups });
    setOpen(false);
  };

  const handleGameChange = (game: SetupGame) => {
    setSelectedGame(game);
    setSelectedTrack(null);
  };

  const handleViewFull = () => {
    if (displayTrack) setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data || sortedTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
        <p>Unable to load setups</p>
      </div>
    );
  }

  const theme = displayTrack
    ? CIRCUIT_THEMES[displayTrack.circuitKey] ?? CIRCUIT_THEMES.bahrain
    : CIRCUIT_THEMES.bahrain;

  return (
    <div className="space-y-4">
      {/* Game filter */}
      <div className="flex rounded-md border border-border overflow-hidden w-fit">
        {(["f126", "f125"] as SetupGame[]).map((game) => (
          <button
            key={game}
            onClick={() => handleGameChange(game)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              selectedGame === game
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {GAME_LABELS[game]}
          </button>
        ))}
      </div>

      {/* Search / Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-10"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              {displayTrack ? displayTrack.trackName : "Select track..."}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tracks..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No track found.</CommandEmpty>
              <CommandGroup>
                {filteredTracks.map(([circuitKey, setups]) => {
                  const trackName = setups[0]?.trackName ?? circuitKey;
                  const isSelected = displayTrack?.circuitKey === circuitKey;
                  const trackTheme = CIRCUIT_THEMES[circuitKey] ?? CIRCUIT_THEMES.bahrain;
                  return (
                    <CommandItem
                      key={circuitKey}
                      value={trackName}
                      onSelect={() => handleSelect(circuitKey, trackName)}
                      className="gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${trackTheme.primaryColor}20` }}
                      >
                        <TrackOutline
                          circuitShortName={circuitKey}
                          className="w-4 h-4"
                          strokeColor={trackTheme.primaryColor}
                        />
                      </div>
                      <span className={cn(isSelected && "font-medium")}>
                        {trackName}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Full setup display */}
      {displayTrack && (
        <div
          className="rounded-xl border border-border overflow-hidden max-h-[400px] min-h-0 flex flex-col"
          style={{ borderTopColor: theme.primaryColor, borderTopWidth: 3 }}
        >
          <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <TrackOutline
                circuitShortName={displayTrack.circuitKey}
                className="w-5 h-5"
                strokeColor={theme.primaryColor}
              />
            </div>
            <div>
              <p className="font-semibold">{displayTrack.trackName}</p>
              <p className="text-xs text-muted-foreground">
                {displayTrack.setups.length} setup
                {displayTrack.setups.length !== 1 ? "s" : ""} •{" "}
                {selectedGame === "f126" ? "Theorycrafted & F1Laps" : "Theorycrafted & gruhnd"}
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {displayTrack.setups.map((setup) => (
              <SetupBlock key={`${setup.source}-${setup.track}`} setup={setup} />
            ))}
          </div>
          <div className="p-3 border-t border-border shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewFull}
            >
              View in sheet
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {displayTrack && (
        <SetupDetailSheet
          trackName={displayTrack.trackName}
          circuitKey={displayTrack.circuitKey}
          setups={displayTrack.setups}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-right break-all">{value}</span>
    </div>
  );
}

function SetupBlock({ setup }: { setup: GameSetup }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded",
            setup.source === "theorycrafted"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              : setup.source === "f1laps"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-sky-500/15 text-sky-700 dark:text-sky-400"
          )}
        >
          {setup.createdBy ?? setup.source}
        </span>
      </div>
      <div className="grid gap-1.5 text-xs">
        <Row label="Aero" value={setup.aero} />
        <Row label="Differential" value={setup.differential} />
        <Row label="Susp. Geometry" value={setup.suspensionGeometry} />
        <Row label="Suspension" value={setup.suspension} />
        <Row label="Brakes" value={setup.brakes} />
        {setup.game !== "f126" && <Row label="Tires Q" value={setup.tiresQuali} />}
        <Row label={setup.game === "f126" ? "Tyres (PSI)" : "Tires R"} value={setup.tiresRace} />
        <Row label="Compounds" value={setup.compounds} />
        {setup.strategy && <Row label="Strategy" value={setup.strategy} />}
        {setup.laps && <Row label="Laps (50%)" value={setup.laps} />}
        {setup.notes && (
          <p className="text-muted-foreground mt-1.5 pt-1.5 border-t border-border">
            {setup.notes}
          </p>
        )}
      </div>
    </div>
  );
}
