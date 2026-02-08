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
