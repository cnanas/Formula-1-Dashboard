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
}

/** Default empty telemetry for initial state */
export const EMPTY_TELEMETRY: GameTelemetry = {
  speed: 0,
  rpm: 0,
  throttle: 0,
  brake: 0,
  n_gear: 0,
  drs: 0,
};
