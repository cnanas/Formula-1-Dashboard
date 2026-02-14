import { NextRequest, NextResponse } from "next/server";
import { parseYoutubeFeed } from "@/lib/youtube/parser";

const DEFAULT_F1_CHANNEL_ID = "UCB_qr75-ydFVKSF9Dmo6izg";
const DEFAULT_LIMIT = 18;
const MAX_LIMIT = 50;
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;

function parseLimit(rawValue: string | null): number {
  if (!rawValue) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeChannelId(channelId: string | null): string | null {
  if (!channelId) return null;
  const trimmed = channelId.trim();
  if (!CHANNEL_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export async function GET(request: NextRequest) {
  const rawChannelId = request.nextUrl.searchParams.get("channelId");
  const channelIdFromQuery = normalizeChannelId(rawChannelId);
  if (rawChannelId && !channelIdFromQuery) {
    return NextResponse.json(
      { error: "Invalid channelId format" },
      { status: 400 }
    );
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const channelId =
    channelIdFromQuery ??
    normalizeChannelId(process.env.YOUTUBE_CHANNEL_ID) ??
    DEFAULT_F1_CHANNEL_ID;
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(
    channelId
  )}`;

  try {
    const response = await fetch(feedUrl, {
      next: { revalidate: 900 }, // 15 minutes
      headers: {
        "User-Agent": "Formula1Dashboard/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch YouTube feed" },
        { status: 502 }
      );
    }

    const xml = await response.text();
    const parsedFeed = parseYoutubeFeed(xml, channelId);

    return NextResponse.json(
      {
        channelId: parsedFeed.channelId,
        channelTitle: parsedFeed.channelTitle,
        items: parsedFeed.items.slice(0, limit),
        lastFetched: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("YouTube feed fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube videos" },
      { status: 502 }
    );
  }
}
