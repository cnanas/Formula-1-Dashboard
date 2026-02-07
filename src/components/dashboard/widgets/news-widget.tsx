"use client";

import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RSSFeed } from "@/types/rss";

export function NewsWidget() {
  const { data, isLoading } = useSWR<RSSFeed>("/api/rss?source=all", {
    refreshInterval: 300_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const items = (data?.items ?? []).slice(0, 6);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No news available
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item, i) => (
        <a
          key={`${item.link}-${i}`}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-2 px-1 rounded-md hover:bg-muted/50 transition-colors"
        >
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.source}
            </Badge>
            {item.pubDate && (
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(item.pubDate), "MMM d")}
              </span>
            )}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground ml-auto" />
          </div>
        </a>
      ))}
      <Link
        href="/news"
        className="block text-xs text-center text-muted-foreground hover:text-foreground pt-2"
      >
        View all news →
      </Link>
    </div>
  );
}
