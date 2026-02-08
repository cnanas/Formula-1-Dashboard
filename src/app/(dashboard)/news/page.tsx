"use client";

import { useState } from "react";
import Image from "next/image";
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

// Source-specific colors for badges
const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Formula 1": { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/30" },
  "Autosport": { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30" },
  "Motorsport.com": { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30" },
  "The Race": { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30" },
  "RaceFans": { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-500/30" },
};

function getSourceStyle(source: string) {
  return SOURCE_COLORS[source] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
}

export default function NewsPage() {
  const [activeSource, setActiveSource] = useState("All");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const { data, isLoading } = useSWR<RSSFeed>("/api/rss?source=all", {
    refreshInterval: 300_000, // 5 minutes
  });

  if (isLoading) return <PageSkeleton />;

  const items = data?.items ?? [];
  const filtered =
    activeSource === "All"
      ? items
      : items.filter((item) => item.source === activeSource);

  const handleImageError = (link: string) => {
    setImageErrors((prev) => new Set(prev).add(link));
  };

  return (
    <div className="space-y-6">
      {/* Source filters */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((source) => {
          const style = getSourceStyle(source);
          const isActive = activeSource === source;
          return (
            <Button
              key={source}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSource(source)}
              className={!isActive && source !== "All" ? `${style.bg} ${style.text} ${style.border} border hover:opacity-80` : ""}
            >
              {source}
            </Button>
          );
        })}
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
          {filtered.map((item, index) => {
            const style = getSourceStyle(item.source);
            const hasImage = item.imageUrl && !imageErrors.has(item.link);
            
            return (
              <a
                key={`${item.link}-${index}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer">
                  {/* Featured Image */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {hasImage ? (
                      <Image
                        src={item.imageUrl!}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(item.link)}
                        unoptimized
                      />
                    ) : (
                      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${style.bg} to-muted/30`}>
                        <span className={`text-xl font-bold tracking-tight opacity-90 ${style.text}`}>
                          {item.source}
                        </span>
                      </div>
                    )}
                    {/* Source badge overlay */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs font-medium ${style.bg} ${style.text} ${style.border} border backdrop-blur-sm`}
                      >
                        {item.source}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="pt-4 flex flex-col h-[160px]">
                    <h3 className="font-semibold text-lg leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.pubDate && (
                      <span className="text-sm text-muted-foreground mb-2">
                        {format(new Date(item.pubDate), "MMM d, yyyy")}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      Read more
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
