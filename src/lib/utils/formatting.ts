/**
 * Format a lap time in seconds to mm:ss.SSS
 */
export function formatLapTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
  }
  return secs.toFixed(3);
}

/**
 * Format a gap/interval value.
 * Positive values get a "+" prefix.
 */
export function formatGap(value: number | null | string): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (value === 0) return "LEADER";
  return `+${value.toFixed(3)}`;
}

/**
 * Format a speed value with units.
 */
export function formatSpeed(speed: number): string {
  return `${speed} km/h`;
}

/**
 * Format a pit stop duration.
 */
export function formatPitDuration(seconds: number | null): string {
  if (seconds === null) return "-";
  return `${seconds.toFixed(1)}s`;
}
