import type { OpenF1Endpoint, OpenF1QueryParams } from "@/types/openf1";
import { CacheTTL } from "./cache";

const OPENF1_BASE = "https://api.openf1.org/v1";

/**
 * Build a query string from params, filtering out undefined values.
 */
export function buildQueryString(params: OpenF1QueryParams): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, String(value));
  }
  return "?" + searchParams.toString();
}

/**
 * Build the full URL for an OpenF1 API endpoint.
 */
export function buildUrl(
  endpoint: OpenF1Endpoint,
  params: OpenF1QueryParams = {}
): string {
  return `${OPENF1_BASE}/${endpoint}${buildQueryString(params)}`;
}

/**
 * Build a relative path for the proxy API route.
 */
export function buildProxyPath(
  endpoint: OpenF1Endpoint,
  params: OpenF1QueryParams = {}
): string {
  return `/${endpoint}${buildQueryString(params)}`;
}

/**
 * Cache configuration per endpoint.
 */
export function getEndpointCacheTTL(endpoint: OpenF1Endpoint): {
  ttl: number;
  persist: boolean;
} {
  switch (endpoint) {
    case "car_data":
    case "location":
      return { ttl: CacheTTL.TELEMETRY, persist: false };
    case "position":
    case "intervals":
      return { ttl: CacheTTL.LIVE, persist: false };
    case "race_control":
    case "team_radio":
      return { ttl: CacheTTL.RACE_CONTROL, persist: false };
    case "weather":
      return { ttl: CacheTTL.WEATHER, persist: false };
    case "meetings":
      return { ttl: CacheTTL.MEETINGS, persist: true };
    case "sessions":
      return { ttl: CacheTTL.SESSIONS, persist: true };
    case "drivers":
      return { ttl: CacheTTL.DRIVERS, persist: true };
    case "championship_drivers":
    case "championship_teams":
      return { ttl: CacheTTL.STANDINGS, persist: true };
    case "laps":
    case "session_result":
    case "starting_grid":
    case "stints":
    case "pit":
    case "overtakes":
      return { ttl: CacheTTL.SESSION_STATS, persist: false };
    default:
      return { ttl: CacheTTL.STANDINGS, persist: false };
  }
}

/**
 * Priority levels for rate limiter queue.
 * Higher number = higher priority.
 */
export function getEndpointPriority(endpoint: OpenF1Endpoint): number {
  switch (endpoint) {
    case "position":
    case "intervals":
      return 3; // Critical live data
    case "car_data":
    case "race_control":
    case "weather":
    case "location":
      return 2; // Supporting live data
    default:
      return 1; // Historical / static data
  }
}
