"use client";

import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { format } from "date-fns";
import { ExternalLink, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { YoutubeFeed } from "@/types/youtube";

interface YoutubeFeedError {
  error: string;
}

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return format(date, "MMM d");
}

export function YoutubeWidget() {
  const { data, isLoading } = useSWR<YoutubeFeed | YoutubeFeedError>("/api/youtube?limit=5", {
    refreshInterval: 600_000, // 10 minutes
  });
  const apiError = data && "error" in data ? data.error : null;
  const feed = data && "items" in data ? data : null;

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-20 shrink-0 rounded-md" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (apiError) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {apiError}
      </p>
    );
  }

  const items = feed?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No videos available
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Youtube className="h-3 w-3 text-red-500" />
          {feed?.channelTitle || "Formula 1"}
        </Badge>
      </div>

      <div className="space-y-2">
        {items.slice(0, 4).map((video) => (
          <a
            key={video.videoId}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/50"
          >
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Youtube className="h-5 w-5 text-red-500/70" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                {video.title}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatPublishedDate(video.publishedAt)}
              </p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
          </a>
        ))}
      </div>

      <Link
        href="/youtube"
        className="block pt-1 text-center text-xs text-muted-foreground hover:text-foreground"
      >
        View videos in dashboard →
      </Link>
    </div>
  );
}
