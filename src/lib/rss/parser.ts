import { XMLParser } from "fast-xml-parser";
import type { RSSItem } from "@/types/rss";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export function parseRSSFeed(xml: string, sourceName: string): RSSItem[] {
  try {
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);

    return items.map((item: Record<string, unknown>) => {
      // Try to extract image from various RSS fields
      let imageUrl: string | undefined;
      const enclosure = item.enclosure as Record<string, string> | undefined;
      if (enclosure?.["@_url"]) {
        imageUrl = enclosure["@_url"];
      }
      const mediaThumbnail = item["media:thumbnail"] as Record<string, string> | undefined;
      if (!imageUrl && mediaThumbnail?.["@_url"]) {
        imageUrl = mediaThumbnail["@_url"];
      }
      const mediaContent = item["media:content"] as Record<string, string> | undefined;
      if (!imageUrl && mediaContent?.["@_url"]) {
        imageUrl = mediaContent["@_url"];
      }

      // Strip HTML tags from description
      const rawDescription = String(item.description || "");
      const description = rawDescription.replace(/<[^>]*>/g, "").slice(0, 200);

      return {
        title: String(item.title || ""),
        link: String(item.link || ""),
        description,
        pubDate: String(item.pubDate || ""),
        source: sourceName,
        imageUrl,
      };
    });
  } catch {
    return [];
  }
}
