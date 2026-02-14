import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/cache/redis";

const OPENF1_BASE = "https://api.openf1.org/v1";
const EMPTY_RESPONSE_MAX_AGE_SECONDS = 30;
const EMPTY_RESPONSE_SWR_SECONDS = 15;
const CACHE_VERSION = "v2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${OPENF1_BASE}/${endpoint}${searchParams ? `?${searchParams}` : ""}`;
  const cachePolicy = getCachePolicy(endpoint);
  const cacheKey = `openf1:${CACHE_VERSION}:${endpoint}${searchParams ? `?${searchParams}` : ""}`;

  // Try Redis cache first (server-side)
  const cached = await redisGet<unknown>(cacheKey);
  const hasEmptyArrayCache = Array.isArray(cached) && cached.length === 0;
  if (cached != null && !hasEmptyArrayCache) {
    const effectiveCachePolicy = getEffectiveCachePolicy(cachePolicy, cached);
    const cacheControl = `public, max-age=${effectiveCachePolicy.maxAgeSeconds}, s-maxage=${effectiveCachePolicy.maxAgeSeconds}, stale-while-revalidate=${effectiveCachePolicy.staleWhileRevalidateSeconds}`;
    return NextResponse.json(cached, {
      headers: { "Cache-Control": cacheControl },
    });
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenF1 API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const effectiveCachePolicy = getEffectiveCachePolicy(cachePolicy, data);

    // Store in Redis for next time
    await redisSet(cacheKey, data, effectiveCachePolicy.maxAgeSeconds);

    const cacheControl = `public, max-age=${effectiveCachePolicy.maxAgeSeconds}, s-maxage=${effectiveCachePolicy.maxAgeSeconds}, stale-while-revalidate=${effectiveCachePolicy.staleWhileRevalidateSeconds}`;

    return NextResponse.json(data, {
      headers: { "Cache-Control": cacheControl },
    });
  } catch (error) {
    console.error("OpenF1 proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from OpenF1 API" },
      { status: 502 }
    );
  }
}

function getCachePolicy(endpoint: string): {
  maxAgeSeconds: number;
  staleWhileRevalidateSeconds: number;
} {
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

function getEffectiveCachePolicy<T>(
  basePolicy: { maxAgeSeconds: number; staleWhileRevalidateSeconds: number },
  data: T
): { maxAgeSeconds: number; staleWhileRevalidateSeconds: number } {
  if (Array.isArray(data) && data.length === 0) {
    return {
      maxAgeSeconds: Math.min(basePolicy.maxAgeSeconds, EMPTY_RESPONSE_MAX_AGE_SECONDS),
      staleWhileRevalidateSeconds: Math.min(
        basePolicy.staleWhileRevalidateSeconds,
        EMPTY_RESPONSE_SWR_SECONDS
      ),
    };
  }

  return basePolicy;
}
