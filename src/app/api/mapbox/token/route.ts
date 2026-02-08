import { NextRequest, NextResponse } from "next/server";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

/**
 * Returns the Mapbox token for client-side map initialization.
 * Keeps the token out of the client bundle; it is sent at runtime only.
 * Optional: restrict by Origin/Referer so only your domain can use it.
 */
export async function GET(request: NextRequest) {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 503 }
    );
  }

  // Optional: restrict to allowed origins (e.g. https://yourdomain.com, https://*.vercel.app)
  const allowedOrigins = process.env.MAPBOX_ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
  if (allowedOrigins?.length) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const ok = origin && allowedOrigins.some((o) => origin.startsWith(o));
    const okReferer = referer && allowedOrigins.some((o) => referer.startsWith(o));
    if (!ok && !okReferer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ token: MAPBOX_TOKEN });
}
