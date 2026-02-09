/**
 * Game telemetry types for F1 game (EA/Codemasters) UDP telemetry.
 * Compatible with OpenF1 CarData shape for UI reuse.
 */

export interface GameTelemetry {
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  n_gear: number;
  drs: number;
  /** Steering -100 (full left) to 100 (full right). F1 2024+ only. */
  steering: number;
  /** Clutch 0–100%. */
  clutch: number;
}

/** Default empty telemetry for initial state */
export const EMPTY_TELEMETRY: GameTelemetry = {
  speed: 0,
  rpm: 0,
  throttle: 0,
  brake: 0,
  n_gear: 0,
  drs: 0,
  steering: 0,
  clutch: 0,
};

/** One telemetry sample (stored per lap for historical graphs). */
export interface LapTelemetryPoint {
  t: number;
  speed: number;
  brake: number;
  throttle: number;
  /** Sector at sample time: 0 = S1, 1 = S2, 2 = S3. */
  sector?: number;
}

export interface SectorMetricTriplet {
  s1: number | null;
  s2: number | null;
  s3: number | null;
}

/** One completed lap from Lap Data packet (historical). */
export interface LapRecord {
  lapNum: number;
  lapTimeMs: number;
  sector1Ms: number | null;
  sector2Ms: number | null;
  sector3Ms: number | null;
  /** Last ~3–6 s of lap telemetry for historical graph (optional). */
  telemetry?: LapTelemetryPoint[];
  /** Fuel remaining at lap end (L). */
  fuelRemainingL?: number;
  /** Fuel used during this lap (L), when available. */
  fuelUsedL?: number | null;
  /** Max speed reached during this lap (km/h). */
  topSpeedKph?: number | null;
  /** Min corner speed during this lap (km/h). */
  minCornerSpeedKph?: number | null;
  /** Top speed per sector for this lap (km/h). */
  topSpeedBySectorKph?: SectorMetricTriplet;
  /** Min corner speed per sector for this lap (km/h). */
  minCornerSpeedBySectorKph?: SectorMetricTriplet;
}

/** One race/session record with metadata and laps. */
export interface RaceRecord {
  id: string;
  circuit: string;
  sessionType: string;
  date: string;
  laps: LapRecord[];
}
