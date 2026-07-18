import { describe, expect, it } from "vitest";
import {
  buildCacheControlHeader,
  buildOpenF1CacheKey,
  getEffectiveCachePolicy,
  getServerCachePolicy,
  OPENF1_CACHE_VERSION,
} from "./cache-policy";

describe("getServerCachePolicy", () => {
  it("caches the season calendar for a day", () => {
    expect(getServerCachePolicy("meetings")).toEqual({
      maxAgeSeconds: 86_400,
      staleWhileRevalidateSeconds: 3_600,
    });
  });

  it("caches live telemetry endpoints for seconds only", () => {
    for (const endpoint of ["position", "intervals", "car_data", "location"]) {
      expect(getServerCachePolicy(endpoint).maxAgeSeconds).toBe(4);
    }
  });

  it("caches session stats briefly since they update during a session", () => {
    expect(getServerCachePolicy("laps").maxAgeSeconds).toBe(30);
    expect(getServerCachePolicy("session_result").maxAgeSeconds).toBe(30);
  });

  it("falls back to a 60s policy for unknown endpoints", () => {
    expect(getServerCachePolicy("something_new")).toEqual({
      maxAgeSeconds: 60,
      staleWhileRevalidateSeconds: 30,
    });
  });
});

describe("getEffectiveCachePolicy", () => {
  const longPolicy = { maxAgeSeconds: 86_400, staleWhileRevalidateSeconds: 3_600 };

  it("clamps empty-array responses to a short TTL", () => {
    expect(getEffectiveCachePolicy(longPolicy, [])).toEqual({
      maxAgeSeconds: 30,
      staleWhileRevalidateSeconds: 15,
    });
  });

  it("keeps the base policy for non-empty responses", () => {
    expect(getEffectiveCachePolicy(longPolicy, [{ id: 1 }])).toEqual(longPolicy);
  });

  it("does not clamp below an already-short base policy", () => {
    const short = { maxAgeSeconds: 4, staleWhileRevalidateSeconds: 2 };
    expect(getEffectiveCachePolicy(short, [])).toEqual(short);
  });
});

describe("buildCacheControlHeader", () => {
  it("emits public max-age with stale-while-revalidate", () => {
    expect(
      buildCacheControlHeader({ maxAgeSeconds: 60, staleWhileRevalidateSeconds: 30 })
    ).toBe("public, max-age=60, s-maxage=60, stale-while-revalidate=30");
  });
});

describe("buildOpenF1CacheKey", () => {
  it("matches the proxy route key format", () => {
    expect(buildOpenF1CacheKey("sessions", "?year=2026")).toBe(
      `openf1:${OPENF1_CACHE_VERSION}:sessions?year=2026`
    );
  });

  it("omits the query string when empty", () => {
    expect(buildOpenF1CacheKey("meetings", "")).toBe(
      `openf1:${OPENF1_CACHE_VERSION}:meetings`
    );
  });
});
