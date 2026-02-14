import { XMLParser } from "fast-xml-parser";
import type { YoutubeVideo } from "@/types/youtube";

interface ParsedYoutubeFeed {
  channelId: string;
  channelTitle: string;
  items: YoutubeVideo[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const text = (value as Record<string, unknown>)["#text"];
    if (typeof text === "string") return text.trim();
  }
  return "";
}

function extractVideoId(entry: Record<string, unknown>): string {
  const ytVideoId = toText(entry["yt:videoId"]);
  if (ytVideoId) return ytVideoId;

  const rawId = toText(entry.id);
  if (rawId.startsWith("yt:video:")) {
    return rawId.replace("yt:video:", "");
  }

  const links = toArray(entry.link as Record<string, unknown> | undefined);
  for (const link of links) {
    const href = toText(link["@_href"]);
    if (!href) continue;
    try {
      const url = new URL(href);
      const id = url.searchParams.get("v");
      if (id) return id;
    } catch {
      // Ignore malformed URL values.
    }
  }

  return "";
}

function extractVideoUrl(entry: Record<string, unknown>, videoId: string): string {
  const links = toArray(entry.link as Record<string, unknown> | undefined);
  for (const link of links) {
    const href = toText(link["@_href"]);
    const rel = toText(link["@_rel"]);
    if (!href) continue;
    if (!rel || rel === "alternate") return href;
  }
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  return "";
}

function extractThumbnailUrl(entry: Record<string, unknown>, videoId: string): string {
  const mediaGroup =
    (entry["media:group"] as Record<string, unknown> | undefined) ?? {};
  const thumbnails = toArray(
    mediaGroup["media:thumbnail"] as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | undefined
  );
  for (const thumbnail of thumbnails) {
    const url = toText(thumbnail["@_url"]);
    if (url) return url;
  }
  if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return "";
}

function extractDescription(entry: Record<string, unknown>): string {
  const mediaGroup =
    (entry["media:group"] as Record<string, unknown> | undefined) ?? {};
  const mediaDescription = toText(mediaGroup["media:description"]);
  if (mediaDescription) return mediaDescription;
  return toText(entry.summary);
}

export function parseYoutubeFeed(
  xml: string,
  fallbackChannelId: string
): ParsedYoutubeFeed {
  try {
    const parsed = parser.parse(xml);
    const feed = parsed?.feed as Record<string, unknown> | undefined;
    if (!feed) {
      return {
        channelId: fallbackChannelId,
        channelTitle: "YouTube",
        items: [],
      };
    }

    const entries = toArray(feed.entry as Record<string, unknown> | undefined);
    const feedChannelId = toText(feed["yt:channelId"]);
    const entryChannelId = toText(entries[0]?.["yt:channelId"]);
    const channelId =
      [feedChannelId, entryChannelId, fallbackChannelId].find((value) =>
        CHANNEL_ID_PATTERN.test(value)
      ) ?? fallbackChannelId;
    const channelTitle = toText(feed.title) || "YouTube";

    const items = entries
      .map((entry) => {
        const videoId = extractVideoId(entry);
        if (!videoId) return null;

        const title =
          toText(entry.title) ||
          toText(
            (entry["media:group"] as Record<string, unknown> | undefined)?.[
              "media:title"
            ]
          );
        const publishedAt = toText(entry.published);
        const updatedAt = toText(entry.updated) || publishedAt;
        if (!title || !publishedAt) return null;

        return {
          videoId,
          title,
          description: extractDescription(entry),
          publishedAt,
          updatedAt,
          thumbnailUrl: extractThumbnailUrl(entry, videoId),
          channelId,
          channelTitle,
          url: extractVideoUrl(entry, videoId),
        } satisfies YoutubeVideo;
      })
      .filter((item): item is YoutubeVideo => item !== null)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

    return { channelId, channelTitle, items };
  } catch {
    return {
      channelId: fallbackChannelId,
      channelTitle: "YouTube",
      items: [],
    };
  }
}
