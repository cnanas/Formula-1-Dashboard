/**
 * Two-tier cache: in-memory + localStorage.
 * Memory cache is always checked first for speed.
 * localStorage provides persistence across page reloads for static data.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

const CACHE_PREFIX = "f1dash_";
const EMPTY_RESPONSE_TTL_MS = 30_000;

function isExpired<T>(entry: CacheEntry<T>): boolean {
  const effectiveTtl =
    Array.isArray(entry.data) && entry.data.length === 0
      ? Math.min(entry.ttl, EMPTY_RESPONSE_TTL_MS)
      : entry.ttl;
  return Date.now() - entry.timestamp > effectiveTtl;
}

export function getCached<T>(key: string): T | null {
  // Check memory first
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memEntry && !isExpired(memEntry)) {
    return memEntry.data;
  }

  // Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!isExpired(entry)) {
          // Promote to memory cache
          memoryCache.set(key, entry);
          return entry.data;
        } else {
          localStorage.removeItem(CACHE_PREFIX + key);
        }
      }
    } catch {
      // localStorage unavailable or corrupted
    }
  }

  // Expired memory entry cleanup
  if (memEntry) {
    memoryCache.delete(key);
  }

  return null;
}

export function setCache<T>(
  key: string,
  data: T,
  ttlMs: number,
  persist: boolean = false
): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };

  memoryCache.set(key, entry as CacheEntry<unknown>);

  if (persist && typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage full or unavailable
    }
  }
}

export function clearCache(prefix?: string): void {
  if (prefix) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  } else {
    memoryCache.clear();
  }
}

// Cache TTL presets (in milliseconds)
export const CacheTTL = {
  LIVE: 4_000,           // Live timing data (4s)
  TELEMETRY: 1_000,      // Car telemetry (1s)
  WEATHER: 60_000,       // Weather (60s)
  RACE_CONTROL: 5_000,   // Race control (5s)
  SESSION_STATS: 30_000, // Session stats that can update during a live session (30s)
  STANDINGS: 3_600_000,  // Championship standings (1hr)
  MEETINGS: 86_400_000,  // Season calendar (24hr)
  SESSIONS: 3_600_000,   // Sessions list (1hr)
  DRIVERS: 3_600_000,    // Driver info (1hr)
  IMMUTABLE: 604_800_000, // Historical data (7 days)
} as const;
