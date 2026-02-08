"use client";

import { Calendar } from "lucide-react";
import { useSeason } from "@/providers/season-provider";

export function SeasonBadge() {
  const { season } = useSeason();

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 dark:bg-white/10 backdrop-blur-md border border-border/40 shadow-lg">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold">
          Season {season}
        </span>
      </div>
    </div>
  );
}
