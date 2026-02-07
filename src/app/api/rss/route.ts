import { NextRequest, NextResponse } from "next/server";
import { RSS_SOURCES } from "@/lib/rss/sources";
import { parseRSSFeed } from "@/lib/rss/parser";
import type { RSSItem } from "@/types/rss";

export async function GET(request: NextRequest) {
  const sourceKey = request.nextUrl.searchParams.get("source") || "all";

  const sources =
    sourceKey === "all"
      ? RSS_SOURCES
      : RSS_SOURCES.filter((s) => s.key === sourceKey);

  if (sources.length === 0) {
    return NextResponse.json(
      { error: "Unknown RSS source" },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.allSettled(
      sources.map(async (source) => {
        const response = await fetch(source.url, {
          next: { revalidate: 300 }, // 5 minute cache
        });
        if (!response.ok) return [];
        const xml = await response.text();
        return parseRSSFeed(xml, source.name);
      })
    );

    const allItems: RSSItem[] = results
      .filter(
        (r): r is PromiseFulfilledResult<RSSItem[]> => r.status === "fulfilled"
      )
      .flatMap((r) => r.value)
      .sort(
        (a, b) =>
          new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );

    return NextResponse.json(
      { items: allItems, lastFetched: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("RSS fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSS feeds" },
      { status: 502 }
    );
  }
}
