/**
 * Server-side cache policy for OpenF1 data.
 * Single source of truth shared by the proxy API route and server components
 * (see openf1-server.ts). Pure functions only — safe to import anywhere.
 */

export const OPENF1_CACHE_VERSION = "v2";

const EMPTY_RESPONSE_MAX_AGE_SECONDS = 30;
const EMPTY_RESPONSE_SWR_SECONDS = 15;

export interface CachePolicy {
  maxAgeSeconds: number;
  staleWhileRevalidateSeconds: number;
}

export function getServerCachePolicy(endpoint: string): CachePolicy {
  switch (endpoint) {
    case "meetings":
      return { maxAgeSeconds: 86_400, staleWhileRevalidateSeconds: 3_600 };
    case "sessions":
    case "drivers":
      return { maxAgeSeconds: 3_600, staleWhileRevalidateSeconds: 600 };
    case "championship_drivers":
    case "championship_teams":
      return { maxAgeSeconds: 3_600, staleWhileRevalidateSeconds: 300 };
    case "laps":
    case "session_result":
    case "starting_grid":
    case "stints":
    case "pit":
    case "overtakes":
      return { maxAgeSeconds: 30, staleWhileRevalidateSeconds: 15 };
    case "position":
    case "intervals":
    case "car_data":
    case "location":
      return { maxAgeSeconds: 4, staleWhileRevalidateSeconds: 2 };
    default:
      return { maxAgeSeconds: 60, staleWhileRevalidateSeconds: 30 };
  }
}

/**
 * Empty responses (e.g. a session with no data yet) get a short TTL so they
 * are re-checked quickly instead of being cached for hours.
 */
export function getEffectiveCachePolicy<T>(
  basePolicy: CachePolicy,
  data: T
): CachePolicy {
  if (Array.isArray(data) && data.length === 0) {
    return {
      maxAgeSeconds: Math.min(
        basePolicy.maxAgeSeconds,
        EMPTY_RESPONSE_MAX_AGE_SECONDS
      ),
      staleWhileRevalidateSeconds: Math.min(
        basePolicy.staleWhileRevalidateSeconds,
        EMPTY_RESPONSE_SWR_SECONDS
      ),
    };
  }
  return basePolicy;
}

export function buildCacheControlHeader(policy: CachePolicy): string {
  return `public, max-age=${policy.maxAgeSeconds}, s-maxage=${policy.maxAgeSeconds}, stale-while-revalidate=${policy.staleWhileRevalidateSeconds}`;
}

/**
 * Redis cache key for an OpenF1 request. `queryString` includes the leading
 * "?" (or is empty). Matches the key format used by the proxy route.
 */
export function buildOpenF1CacheKey(
  endpoint: string,
  queryString: string
): string {
  return `openf1:${OPENF1_CACHE_VERSION}:${endpoint}${queryString}`;
}
