"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { ExternalLink, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { RSSFeed } from "@/types/rss";

const SOURCES = ["All", "Formula 1", "Autosport", "Motorsport.com", "The Race", "RaceFans"];

export default function NewsPage() {
  const [activeSource, setActiveSource] = useState("All");

  const { data, isLoading } = useSWR<RSSFeed>("/api/rss?source=all", {
    refreshInterval: 300_000, // 5 minutes
  });

  if (isLoading) return <PageSkeleton />;

  const items = data?.items ?? [];
  const filtered =
    activeSource === "All"
      ? items
      : items.filter((item) => item.source === activeSource);

  return (
    <div className="space-y-6">
      {/* Source filters */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((source) => (
          <Button
            key={source}
            variant={activeSource === source ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSource(source)}
          >
            {source}
          </Button>
        ))}
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No articles found"
          description="Try selecting a different source or check back later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, index) => (
            <a
              key={`${item.link}-${index}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.source}
                    </Badge>
                    {item.pubDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.pubDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    Read more
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
