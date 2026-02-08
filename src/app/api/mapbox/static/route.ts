import { NextRequest, NextResponse } from "next/server";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

/**
 * Proxies Mapbox Static Images API so the token stays server-only.
 * GET /api/mapbox/static?lng=&lat=&theme=dark|light&width=&height=&zoom=
 */
export async function GET(request: NextRequest) {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lng = searchParams.get("lng");
  const lat = searchParams.get("lat");
  const theme = searchParams.get("theme") ?? "light";
  const width = searchParams.get("width") ?? "400";
  const height = searchParams.get("height") ?? "180";
  const zoom = searchParams.get("zoom") ?? "3";
  const markerColor = searchParams.get("marker") ?? "ef4444";

  if (lng == null || lat == null) {
    return NextResponse.json(
      { error: "lng and lat are required" },
      { status: 400 }
    );
  }

  const style =
    theme === "dark" ? "mapbox/dark-v11" : "mapbox/light-v11";
  const url = `https://api.mapbox.com/styles/v1/${style}/static/pin-s+${markerColor}(${lng},${lat})/${lng},${lat},${zoom},0,0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Mapbox static image failed" },
      { status: res.status }
    );
  }

  const blob = await res.blob();
  const contentType = res.headers.get("content-type") ?? "image/png";
  return new NextResponse(blob, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
