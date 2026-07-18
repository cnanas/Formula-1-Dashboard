import { NextRequest, NextResponse } from "next/server";
import type { OpenF1Endpoint } from "@/types/openf1";
import { getOpenF1, OpenF1Error } from "@/lib/api/openf1-server";
import {
  buildCacheControlHeader,
  getEffectiveCachePolicy,
  getServerCachePolicy,
} from "@/lib/api/cache-policy";

/**
 * Proxy for client-side OpenF1 requests. Caching (Redis + policy) lives in
 * getOpenF1 so server components and this route share one implementation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/") as OpenF1Endpoint;
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const data = await getOpenF1(endpoint, searchParams);
    const policy = getEffectiveCachePolicy(
      getServerCachePolicy(endpoint),
      data
    );
    return NextResponse.json(data, {
      headers: { "Cache-Control": buildCacheControlHeader(policy) },
    });
  } catch (error) {
    if (error instanceof OpenF1Error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("OpenF1 proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from OpenF1 API" },
      { status: 502 }
    );
  }
}
