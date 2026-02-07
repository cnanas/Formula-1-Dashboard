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

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenF1 API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Set cache headers based on data type
    const cacheControl = getCacheControl(endpoint);

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

function getCacheControl(endpoint: string): string {
  switch (endpoint) {
    case "meetings":
      return "public, s-maxage=86400, stale-while-revalidate=3600";
    case "sessions":
    case "drivers":
      return "public, s-maxage=3600, stale-while-revalidate=600";
    case "championship_drivers":
    case "championship_teams":
      return "public, s-maxage=3600, stale-while-revalidate=300";
    case "laps":
    case "stints":
    case "pit":
    case "overtakes":
    case "session_result":
    case "starting_grid":
      return "public, s-maxage=604800, stale-while-revalidate=86400";
    case "position":
    case "intervals":
    case "car_data":
    case "location":
      return "public, s-maxage=4, stale-while-revalidate=2";
    default:
      return "public, s-maxage=60, stale-while-revalidate=30";
  }
}
