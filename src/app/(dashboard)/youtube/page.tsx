"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink, Play, Search, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataReliability } from "@/components/shared/data-reliability";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import type { YoutubeFeed, YoutubeVideo } from "@/types/youtube";

interface YoutubeFeedError {
  error: string;
}
const REFRESH_INTERVAL_MS = 600_000;

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAbsoluteDate(value: string): string {
  const date = toDate(value);
  return date ? format(date, "MMM d, yyyy") : "Unknown date";
}

function formatRelativeDate(value: string): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "";
}

export default function YoutubePage() {
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [search, setSearch] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const { data, isLoading, isValidating, mutate } = useSWR<YoutubeFeed | YoutubeFeedError>("/api/youtube?limit=30", {
    refreshInterval: REFRESH_INTERVAL_MS, // 10 minutes
  });
  const apiError = data && "error" in data ? data.error : null;
  const feed = data && "items" in data ? data : null;

  const filteredVideos = useMemo(() => {
    const allVideos = feed?.items ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return allVideos;
    return allVideos.filter((video) => {
      return (
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query)
      );
    });
  }, [feed?.items, search]);

  if (isLoading) return <PageSkeleton />;

  const channelTitle = feed?.channelTitle || "Formula 1";

  return (
    <>
      <div className="space-y-6">
        <DataReliability
          sourceLabel="YouTube feed"
          isLoading={isLoading}
          isRefreshing={isValidating}
          error={apiError}
          lastUpdated={feed?.lastFetched}
          refreshIntervalMs={REFRESH_INTERVAL_MS}
          onRefresh={() => {
            void mutate();
          }}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Latest uploads from {channelTitle}
            </p>
            <Badge variant="secondary" className="w-fit gap-1.5 text-xs">
              <Youtube className="h-3.5 w-3.5 text-red-500" />
              Public feed (no channel ownership required)
            </Badge>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search videos"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <EmptyState
            icon={Youtube}
            title={apiError ? "Unable to load YouTube videos" : "No videos found"}
            description={
              apiError
                ? apiError
                : "Try a different search term or check back when new videos are published."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredVideos.map((video) => {
              const hasImage = video.thumbnailUrl && !imageErrors.has(video.videoId);
              return (
                <Card
                  key={video.videoId}
                  className="group h-full overflow-hidden border-border/60 transition-all hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(video)}
                    className="block h-full w-full text-left"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {hasImage ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          onError={() =>
                            setImageErrors((prev) => new Set(prev).add(video.videoId))
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                          <Youtube className="h-10 w-10 text-red-500/80" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm">
                        <Play className="h-4 w-4 fill-white" />
                      </div>
                    </div>
                    <CardContent className="flex h-[180px] flex-col pt-4">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                        {video.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {video.description || "No description available."}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                        <span>{formatAbsoluteDate(video.publishedAt)}</span>
                        <span>{formatRelativeDate(video.publishedAt)}</span>
                      </div>
                    </CardContent>
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[min(100%,980px)] overflow-y-auto p-0">
          {selectedVideo && (
            <>
              <DialogHeader className="px-5 pt-5 text-left sm:px-6 sm:pt-6">
                <DialogTitle className="pr-8 text-base leading-tight sm:text-lg">
                  {selectedVideo.title}
                </DialogTitle>
                <DialogDescription>
                  {formatAbsoluteDate(selectedVideo.publishedAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-border bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Open on YouTube
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
