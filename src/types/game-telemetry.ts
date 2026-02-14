/**
 * Game telemetry types for F1 game (EA/Codemasters) UDP telemetry.
 * Compatible with OpenF1 CarData for TelemetryPanel reuse.
 */

export interface GameTelemetryCarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

/** Session/race summary sent by the relay when final classification is received. */
export interface SessionSummary {
  final: boolean;
  sessionType: string;
  trackName: string;
  totalLaps: number;
  position: number;
  gridPosition: number;
  numLaps: number;
  bestLapTimeMs: number | null;
  bestLapTimeFormatted: string;
  totalRaceTimeMs?: number | null;
  totalRaceTimeFormatted: string;
  numPitStops: number;
  points: number;
  penaltiesTime: number;
  numPenalties: number;
  resultStatus: number;
}
