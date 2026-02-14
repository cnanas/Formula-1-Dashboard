"use client";

import { useCallback, useMemo } from "react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { getLatestCompletedGrandPrixRaceSession } from "@/lib/api/session-selection";
import { formatLapTime } from "@/lib/utils/formatting";
import { useSeason } from "@/providers/season-provider";
import type {
  Driver,
  Lap,
  Meeting,
  Pit,
  RaceControl,
  Session,
  SessionResult,
  StartingGrid,
} from "@/types/openf1";

export interface RecapDriver {
  driverNumber: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColour: string | null;
}

export interface RecapFinisher {
  driver: RecapDriver;
  finishPosition: number;
  gridPosition: number | null;
  gain: number | null;
  laps: number;
  gapLabel: string;
  status: "DNF" | "DNS" | "DSQ" | null;
}

export interface PositionSwing {
  driver: RecapDriver;
  gain: number;
  startPosition: number;
  finishPosition: number;
}

export interface FastestLapSummary {
  driver: RecapDriver;
  lapDuration: number;
  lapNumber: number;
}

export interface FastestPitStopSummary {
  driver: RecapDriver;
  stopDuration: number;
  lapNumber: number;
}

export interface IncidentSummary {
  safetyCar: number;
  virtualSafetyCar: number;
  redFlag: number;
  penalties: number;
  investigations: number;
}

export interface RaceRecapSummary {
  sourceSeason: number;
  usedFallbackSeason: boolean;
  meeting: Meeting | null;
  session: Session;
  winner: RecapDriver | null;
  podium: RecapFinisher[];
  finishers: RecapFinisher[];
  biggestGainer: PositionSwing | null;
  biggestLoser: PositionSwing | null;
  fastestLap: FastestLapSummary | null;
  overtakes: number;
  pitStops: number;
  fastestPitStop: FastestPitStopSummary | null;
  retirements: number;
  didNotStart: number;
  disqualified: number;
  incidents: IncidentSummary;
  highlights: string[];
  headline: string;
}

export interface UseRaceRecapResult {
  recap: RaceRecapSummary | null;
  sourceSeason: number;
  usedFallbackSeason: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

function toErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Unable to load race recap data.";
}

function firstError(...errors: unknown[]): string | null {
  for (const error of errors) {
    const message = toErrorMessage(error);
    if (message) return message;
  }
  return null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function getResultStatus(result: SessionResult): "DNF" | "DNS" | "DSQ" | null {
  if (result.dnf) return "DNF";
  if (result.dns) return "DNS";
  if (result.dsq) return "DSQ";
  return null;
}

function toGapLabel(result: SessionResult): string {
  if (result.position === 1) {
    return formatLapTime(result.duration);
  }
  if (result.gap_to_leader != null && Number.isFinite(result.gap_to_leader)) {
    return `+${result.gap_to_leader.toFixed(3)}s`;
  }
  return "-";
}

function getFallbackAcronym(name: string, driverNumber: number): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 3);
  return letters || `#${driverNumber}`;
}

function toRecapDriver(
  driverNumber: number,
  driverMap: Map<number, Driver>
): RecapDriver {
  const driver = driverMap.get(driverNumber);
  const name = driver?.full_name?.trim() || driver?.broadcast_name?.trim() || `#${driverNumber}`;
  const acronym = driver?.name_acronym?.trim() || getFallbackAcronym(name, driverNumber);
  const teamName = driver?.team_name?.trim() || "Unknown";

  return {
    driverNumber,
    name,
    acronym,
    teamName,
    teamColour: driver?.team_colour ?? null,
  };
}

function findFastestLap(
  laps: Lap[],
  driverMap: Map<number, Driver>
): FastestLapSummary | null {
  let fastestLap: Lap | null = null;

  for (const lap of laps) {
    if (lap.is_pit_out_lap || lap.lap_duration == null) continue;
    if (!fastestLap || lap.lap_duration < (fastestLap.lap_duration ?? Number.POSITIVE_INFINITY)) {
      fastestLap = lap;
    }
  }

  if (!fastestLap || fastestLap.lap_duration == null) return null;

  return {
    driver: toRecapDriver(fastestLap.driver_number, driverMap),
    lapDuration: fastestLap.lap_duration,
    lapNumber: fastestLap.lap_number,
  };
}

function findFastestPitStop(
  pits: Pit[],
  driverMap: Map<number, Driver>
): FastestPitStopSummary | null {
  let fastest: Pit | null = null;

  for (const pit of pits) {
    if (pit.stop_duration == null || pit.stop_duration <= 0) continue;
    if (!fastest || pit.stop_duration < (fastest.stop_duration ?? Number.POSITIVE_INFINITY)) {
      fastest = pit;
    }
  }

  if (!fastest || fastest.stop_duration == null) return null;

  return {
    driver: toRecapDriver(fastest.driver_number, driverMap),
    stopDuration: fastest.stop_duration,
    lapNumber: fastest.lap_number,
  };
}

function summarizeIncidents(raceControl: RaceControl[]): IncidentSummary {
  const summary: IncidentSummary = {
    safetyCar: 0,
    virtualSafetyCar: 0,
    redFlag: 0,
    penalties: 0,
    investigations: 0,
  };
  const dedupe = new Set<string>();

  for (const item of raceControl) {
    const normalized = normalizeText(
      `${item.message} ${item.category ?? ""} ${item.flag ?? ""}`
    );
    const key = `${item.lap_number ?? "na"}|${normalized}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);

    const hasVsc =
      normalized.includes("virtual safety car") || /\bvsc\b/.test(normalized);

    if (hasVsc) {
      summary.virtualSafetyCar += 1;
    } else if (normalized.includes("safety car")) {
      summary.safetyCar += 1;
    }

    if (normalized.includes("red flag")) {
      summary.redFlag += 1;
    }
    if (normalized.includes("penalty")) {
      summary.penalties += 1;
    }
    if (normalized.includes("investigat")) {
      summary.investigations += 1;
    }
  }

  return summary;
}

function buildHighlights(
  winner: RecapDriver | null,
  meeting: Meeting | null,
  biggestGainer: PositionSwing | null,
  fastestLap: FastestLapSummary | null,
  fastestPitStop: FastestPitStopSummary | null,
  incidents: IncidentSummary,
  overtakes: number,
  retirements: number
): string[] {
  const highlights: string[] = [];

  if (winner && meeting) {
    highlights.push(`${winner.name} won the ${meeting.meeting_name}.`);
  }

  if (biggestGainer) {
    highlights.push(
      `${biggestGainer.driver.name} gained ${biggestGainer.gain} place${
        biggestGainer.gain === 1 ? "" : "s"
      } (${biggestGainer.startPosition} -> ${biggestGainer.finishPosition}).`
    );
  }

  if (fastestLap) {
    highlights.push(
      `Fastest lap: ${fastestLap.driver.name} in ${formatLapTime(
        fastestLap.lapDuration
      )} (lap ${fastestLap.lapNumber}).`
    );
  }

  if (fastestPitStop) {
    highlights.push(
      `Fastest stop: ${fastestPitStop.driver.name}, ${fastestPitStop.stopDuration.toFixed(
        3
      )}s on lap ${fastestPitStop.lapNumber}.`
    );
  }

  const neutralizations = incidents.safetyCar + incidents.virtualSafetyCar + incidents.redFlag;
  if (neutralizations > 0) {
    highlights.push(
      `Race control: ${incidents.safetyCar} SC, ${incidents.virtualSafetyCar} VSC, ${incidents.redFlag} red flag${
        incidents.redFlag === 1 ? "" : "s"
      }.`
    );
  }

  if (overtakes > 0) {
    highlights.push(`${overtakes} recorded on-track overtakes.`);
  }

  if (retirements > 0) {
    highlights.push(`${retirements} driver${retirements === 1 ? "" : "s"} did not finish.`);
  }

  if (highlights.length === 0) {
    highlights.push("No standout events detected for this race.");
  }

  return highlights.slice(0, 6);
}

function buildRecapSummary({
  season,
  usedFallbackSeason,
  session,
  meeting,
  results,
  drivers,
  startingGrid,
  laps,
  pits,
  overtakes,
  raceControl,
}: {
  season: number;
  usedFallbackSeason: boolean;
  session: Session;
  meeting: Meeting | null;
  results: SessionResult[];
  drivers: Driver[];
  startingGrid: StartingGrid[];
  laps: Lap[];
  pits: Pit[];
  overtakes: number;
  raceControl: RaceControl[];
}): RaceRecapSummary {
  const driverMap = new Map(drivers.map((driver) => [driver.driver_number, driver]));
  const gridMap = new Map(startingGrid.map((entry) => [entry.driver_number, entry.position]));
  const sortedResults = [...results].sort((a, b) => a.position - b.position);

  const finishers: RecapFinisher[] = sortedResults.map((result) => {
    const gridPosition = gridMap.get(result.driver_number) ?? null;
    const gain = gridPosition != null ? gridPosition - result.position : null;

    return {
      driver: toRecapDriver(result.driver_number, driverMap),
      finishPosition: result.position,
      gridPosition,
      gain,
      laps: result.number_of_laps,
      gapLabel: toGapLabel(result),
      status: getResultStatus(result),
    };
  });

  const podium = finishers.slice(0, 3);
  const winner = podium[0]?.driver ?? null;

  const movers = finishers.filter(
    (finisher): finisher is RecapFinisher & { gain: number; gridPosition: number } =>
      finisher.gain != null && finisher.gridPosition != null
  );

  const gainer = [...movers]
    .filter((item) => item.gain > 0)
    .sort((a, b) => b.gain - a.gain || a.finishPosition - b.finishPosition)[0];
  const loser = [...movers]
    .filter((item) => item.gain < 0)
    .sort((a, b) => a.gain - b.gain || a.finishPosition - b.finishPosition)[0];

  const biggestGainer = gainer
    ? {
        driver: gainer.driver,
        gain: gainer.gain,
        startPosition: gainer.gridPosition,
        finishPosition: gainer.finishPosition,
      }
    : null;

  const biggestLoser = loser
    ? {
        driver: loser.driver,
        gain: loser.gain,
        startPosition: loser.gridPosition,
        finishPosition: loser.finishPosition,
      }
    : null;

  const fastestLap = findFastestLap(laps, driverMap);
  const fastestPitStop = findFastestPitStop(pits, driverMap);
  const incidents = summarizeIncidents(raceControl);

  const retirements = sortedResults.filter((result) => result.dnf).length;
  const didNotStart = sortedResults.filter((result) => result.dns).length;
  const disqualified = sortedResults.filter((result) => result.dsq).length;

  const highlights = buildHighlights(
    winner,
    meeting,
    biggestGainer,
    fastestLap,
    fastestPitStop,
    incidents,
    overtakes,
    retirements
  );
  const headline = winner && meeting
    ? `${winner.name} wins ${meeting.meeting_name}`
    : meeting
    ? `${meeting.meeting_name} recap`
    : "Latest race recap";

  return {
    sourceSeason: season,
    usedFallbackSeason,
    meeting,
    session,
    winner,
    podium,
    finishers,
    biggestGainer,
    biggestLoser,
    fastestLap,
    overtakes,
    pitStops: pits.length,
    fastestPitStop,
    retirements,
    didNotStart,
    disqualified,
    incidents,
    highlights,
    headline,
  };
}

export function useRaceRecap(): UseRaceRecapResult {
  const { season, availableSeasons } = useSeason();

  const {
    data: seasonRaceSessions,
    isLoading: seasonRaceSessionsLoading,
    error: seasonRaceSessionsError,
    mutate: mutateSeasonRaceSessions,
  } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  const latestRaceSession = useMemo(
    () => getLatestCompletedGrandPrixRaceSession(seasonRaceSessions),
    [seasonRaceSessions]
  );

  const fallbackSeason = useMemo(() => {
    if (latestRaceSession) return null;
    return availableSeasons.find((year) => year < season) ?? null;
  }, [availableSeasons, latestRaceSession, season]);

  const {
    data: fallbackRaceSessions,
    isLoading: fallbackRaceSessionsLoading,
    error: fallbackRaceSessionsError,
    mutate: mutateFallbackRaceSessions,
  } = useOpenF1(
    "sessions",
    { year: fallbackSeason ?? 0, session_type: "Race" },
    { enabled: !!fallbackSeason }
  );

  const fallbackSession = useMemo(
    () => getLatestCompletedGrandPrixRaceSession(fallbackRaceSessions),
    [fallbackRaceSessions]
  );

  const session = latestRaceSession ?? fallbackSession ?? null;
  const sourceSeason = latestRaceSession ? season : fallbackSeason ?? season;
  const usedFallbackSeason = !latestRaceSession && !!fallbackSession;
  const sessionKey = session?.session_key?.toString();
  const meetingKey = session?.meeting_key?.toString();

  const {
    data: meetings,
    isLoading: meetingLoading,
    error: meetingError,
    mutate: mutateMeetings,
  } = useOpenF1(
    "meetings",
    { meeting_key: meetingKey },
    { enabled: !!meetingKey }
  );
  const meeting = meetings[0] ?? null;

  const {
    data: results,
    isLoading: resultsLoading,
    error: resultsError,
    mutate: mutateResults,
  } = useOpenF1(
    "session_result",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const {
    data: drivers,
    isLoading: driversLoading,
    error: driversError,
    mutate: mutateDrivers,
  } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const {
    data: startingGrid,
    isLoading: startingGridLoading,
    error: startingGridError,
    mutate: mutateStartingGrid,
  } = useOpenF1(
    "starting_grid",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const {
    data: laps,
    isLoading: lapsLoading,
    error: lapsError,
    mutate: mutateLaps,
  } = useOpenF1(
    "laps",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const {
    data: pits,
    isLoading: pitsLoading,
    error: pitsError,
    mutate: mutatePits,
  } = useOpenF1(
    "pit",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const {
    data: overtakes,
    isLoading: overtakesLoading,
    error: overtakesError,
    mutate: mutateOvertakes,
  } = useOpenF1(
    "overtakes",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const {
    data: raceControl,
    isLoading: raceControlLoading,
    error: raceControlError,
    mutate: mutateRaceControl,
  } = useOpenF1(
    "race_control",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const recap = useMemo(() => {
    if (!session) return null;

    return buildRecapSummary({
      season: sourceSeason,
      usedFallbackSeason,
      session,
      meeting,
      results,
      drivers,
      startingGrid,
      laps,
      pits,
      overtakes: overtakes.length,
      raceControl,
    });
  }, [
    sourceSeason,
    usedFallbackSeason,
    session,
    meeting,
    results,
    drivers,
    startingGrid,
    laps,
    pits,
    overtakes.length,
    raceControl,
  ]);

  const isLoading =
    seasonRaceSessionsLoading ||
    (fallbackSeason != null && fallbackRaceSessionsLoading) ||
    (!!sessionKey &&
      (meetingLoading ||
        resultsLoading ||
        driversLoading ||
        startingGridLoading ||
        lapsLoading ||
        pitsLoading ||
        overtakesLoading ||
        raceControlLoading));

  const error = firstError(
    seasonRaceSessionsError,
    fallbackRaceSessionsError,
    meetingError,
    resultsError,
    driversError,
    startingGridError,
    lapsError,
    pitsError,
    overtakesError,
    raceControlError
  );

  const refresh = useCallback(() => {
    void mutateSeasonRaceSessions();
    if (fallbackSeason != null) {
      void mutateFallbackRaceSessions();
    }
    if (meetingKey) {
      void mutateMeetings();
    }
    if (sessionKey) {
      void mutateResults();
      void mutateDrivers();
      void mutateStartingGrid();
      void mutateLaps();
      void mutatePits();
      void mutateOvertakes();
      void mutateRaceControl();
    }
  }, [
    fallbackSeason,
    meetingKey,
    mutateDrivers,
    mutateFallbackRaceSessions,
    mutateLaps,
    mutateMeetings,
    mutateOvertakes,
    mutatePits,
    mutateRaceControl,
    mutateResults,
    mutateSeasonRaceSessions,
    mutateStartingGrid,
    sessionKey,
  ]);

  return {
    recap,
    sourceSeason,
    usedFallbackSeason,
    isLoading,
    error,
    refresh,
  };
}
