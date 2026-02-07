import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${OPENF1_BASE}/${endpoint}${searchParams ? `?${searchParams}` : ""}`;
  const cachePolicy = getCachePolicy(endpoint);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: cachePolicy.maxAgeSeconds },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenF1 API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const cacheControl = `public, max-age=${cachePolicy.maxAgeSeconds}, s-maxage=${cachePolicy.maxAgeSeconds}, stale-while-revalidate=${cachePolicy.staleWhileRevalidateSeconds}`;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": cacheControl,
      },
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
    case "stints":
    case "pit":
    case "overtakes":
    case "session_result":
    case "starting_grid":
      return { maxAgeSeconds: 604_800, staleWhileRevalidateSeconds: 86_400 };
    case "position":
    case "intervals":
    case "car_data":
    case "location":
      return { maxAgeSeconds: 4, staleWhileRevalidateSeconds: 2 };
    default:
      return { maxAgeSeconds: 60, staleWhileRevalidateSeconds: 30 };
  }
}
