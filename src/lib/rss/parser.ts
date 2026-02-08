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

    // Channel-level image (e.g. F1 feed has no per-article images, only channel image)
    const channelImage =
      typeof channel.image === "object" && channel.image?.url
        ? String(channel.image.url)
        : undefined;

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
      // Some feeds (e.g. Formula1.com) put image in description as <img>
      const rawDescription = String(item.description || "");
      if (!imageUrl && rawDescription) {
        const imgMatch = rawDescription.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch?.[1]) imageUrl = imgMatch[1];
      }
      // content:encoded (WordPress-style)
      const contentEncoded = item["content:encoded"] as string | undefined;
      if (!imageUrl && contentEncoded) {
        const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch?.[1]) imageUrl = imgMatch[1];
      }

      // Resolve relative image URLs (e.g. //media.formula1.com/... or /content/f1/...)
      if (imageUrl && (imageUrl.startsWith("//") || imageUrl.startsWith("/"))) {
        const link = String(item.link || "");
        try {
          const base = link ? new URL(link) : null;
          if (base) imageUrl = new URL(imageUrl, base.origin).href;
        } catch {
          if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;
        }
      }

      // Fallback: use channel image when item has no image (e.g. Formula1.com feed)
      if (!imageUrl && channelImage) {
        imageUrl = channelImage;
      }

      // Strip HTML tags from description
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
