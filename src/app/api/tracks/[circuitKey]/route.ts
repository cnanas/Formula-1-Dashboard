import { NextRequest, NextResponse } from "next/server";
import { getCircuitSlug } from "@/lib/constants/track-layouts";
import { redisGet, redisSet } from "@/lib/cache/redis";
import type { Meeting, Session, SessionResult, StartingGrid, Driver } from "@/types/openf1";

const OPENF1_BASE = "https://api.openf1.org/v1";
const YEARS = [2023, 2024, 2025, 2026];
const TRACK_HISTORY_CACHE_TTL_SECONDS = 86_400; // 24 hours

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
  return res.json();
}

export interface TrackHistoryRaceResult {
  year: number;
  meeting_key: number;
  session_key: number;
  meeting_name: string;
  date_start: string;
  winner: { driver_number: number; full_name: string; team_name: string } | null;
  pole: { driver_number: number; full_name: string; team_name: string } | null;
  podium: Array<{ position: number; driver_number: number; full_name: string; team_name: string }>;
  laps: number;
}

export interface TrackHistoryResponse {
  circuitKey: string;
  circuitInfo: {
    circuit_key: number;
    circuit_short_name: string;
    country_name: string;
    location: string;
    circuit_type?: string;
    circuit_image?: string;
    country_flag?: string;
  } | null;
  raceHistory: TrackHistoryRaceResult[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ circuitKey: string }> }
) {
  const { circuitKey } = await params;
  const slug = decodeURIComponent(circuitKey).toLowerCase().replace(/\s+/g, "");

  const cacheKey = `tracks:${slug}`;
  const cached = await redisGet<TrackHistoryResponse>(cacheKey);
  if (cached != null) {
    return NextResponse.json(cached);
  }

  const allMeetings: Meeting[] = [];
  for (const year of YEARS) {
    try {
      const data = await fetchJson<Meeting[]>(
        `${OPENF1_BASE}/meetings?year=${year}`
      );
      allMeetings.push(...data);
    } catch {
      // Skip year if API fails
    }
  }

  const circuitMeetings = allMeetings.filter((m) => getCircuitSlug(m.circuit_short_name) === slug);

  if (circuitMeetings.length === 0) {
    return NextResponse.json(
      { error: "Circuit not found", circuitKey: slug },
      { status: 404 }
    );
  }

  // Use the most recent meeting for circuitInfo so we get circuit_image, country_flag, circuit_type
  const byYearDesc = [...circuitMeetings].sort((a, b) => b.year - a.year);
  const bestMeeting =
    byYearDesc.find((m) => m.circuit_image || m.country_flag) ?? byYearDesc[0];
  const circuitInfo: TrackHistoryResponse["circuitInfo"] = {
    circuit_key: bestMeeting.circuit_key,
    circuit_short_name: bestMeeting.circuit_short_name,
    country_name: bestMeeting.country_name,
    location: bestMeeting.location,
    circuit_type: bestMeeting.circuit_type,
    circuit_image: bestMeeting.circuit_image,
    country_flag: bestMeeting.country_flag,
  };

  const raceHistory: TrackHistoryRaceResult[] = [];
  const driverMap = new Map<number, { full_name: string; team_name: string }>();

  for (const meeting of circuitMeetings.sort((a, b) => b.year - a.year)) {
    let sessions: Session[] = [];
    try {
      sessions = await fetchJson<Session[]>(
        `${OPENF1_BASE}/sessions?meeting_key=${meeting.meeting_key}`
      );
    } catch {
      continue;
    }

    const raceSession = sessions.find((s) => s.session_type === "Race");
    if (!raceSession) continue;

    let results: SessionResult[] = [];
    let grid: StartingGrid[] = [];
    try {
      [results, grid] = await Promise.all([
        fetchJson<SessionResult[]>(
          `${OPENF1_BASE}/session_result?session_key=${raceSession.session_key}`
        ),
        fetchJson<StartingGrid[]>(
          `${OPENF1_BASE}/starting_grid?session_key=${raceSession.session_key}`
        ),
      ]);
    } catch {
      continue;
    }

    let drivers: Driver[] = [];
    try {
      drivers = await fetchJson<Driver[]>(
        `${OPENF1_BASE}/drivers?session_key=${raceSession.session_key}`
      );
    } catch {
      // continue with empty driver names
    }
    drivers.forEach((d) => driverMap.set(d.driver_number, { full_name: d.full_name, team_name: d.team_name }));

    const winnerResult = results.find((r) => r.position === 1);
    const poleGrid = grid.find((g) => g.position === 1);
    const podiumResults = results.filter((r) => r.position >= 1 && r.position <= 3).sort((a, b) => a.position - b.position);

    const getDriver = (driverNumber: number) => {
      const d = driverMap.get(driverNumber);
      return d ? { driver_number: driverNumber, full_name: d.full_name, team_name: d.team_name } : { driver_number: driverNumber, full_name: `#${driverNumber}`, team_name: "-" };
    };

    raceHistory.push({
      year: meeting.year,
      meeting_key: meeting.meeting_key,
      session_key: raceSession.session_key,
      meeting_name: meeting.meeting_name,
      date_start: meeting.date_start,
      winner: winnerResult ? getDriver(winnerResult.driver_number) : null,
      pole: poleGrid ? getDriver(poleGrid.driver_number) : null,
      podium: podiumResults.map((r) => ({ position: r.position, ...getDriver(r.driver_number) })),
      laps: winnerResult?.number_of_laps ?? 0,
    });
  }

  const response: TrackHistoryResponse = {
    circuitKey: slug,
    circuitInfo,
    raceHistory: raceHistory.sort((a, b) => b.year - a.year),
  };

  await redisSet(cacheKey, response, TRACK_HISTORY_CACHE_TTL_SECONDS);

  return NextResponse.json(response);
}
