"use client";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataReliabilityProps {
  sourceLabel?: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  lastUpdated?: string | Date | null;
  refreshIntervalMs?: number;
  onRefresh?: () => void;
  className?: string;
}

function formatLastUpdated(lastUpdated: string | Date): string {
  const date = lastUpdated instanceof Date ? lastUpdated : new Date(lastUpdated);
  if (Number.isNaN(date.getTime())) return "Last update unknown";
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
  return `Updated ${formatted} UTC`;
}

function formatRefreshInterval(refreshIntervalMs?: number): string | null {
  if (!refreshIntervalMs || refreshIntervalMs <= 0) return null;
  if (refreshIntervalMs < 60_000) {
    const seconds = Math.round(refreshIntervalMs / 1_000);
    return `Auto-refresh: ${seconds}s`;
  }
  const minutes = Math.round(refreshIntervalMs / 60_000);
  return `Auto-refresh: ${minutes}m`;
}

export function DataReliability({
  sourceLabel,
  isLoading = false,
  isRefreshing = false,
  error,
  lastUpdated,
  refreshIntervalMs,
  onRefresh,
  className,
}: DataReliabilityProps) {
  const intervalLabel = formatRefreshInterval(refreshIntervalMs);

  const statusIcon = error ? (
    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
  ) : isLoading && !lastUpdated ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
  ) : (
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  );

  const statusText = error
    ? `${sourceLabel ?? "Data source"} issue`
    : isLoading && !lastUpdated
    ? `Loading ${sourceLabel?.toLowerCase() ?? "data"}`
    : lastUpdated
    ? formatLastUpdated(lastUpdated)
    : "Ready";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {statusIcon}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{statusText}</p>
          {(error || intervalLabel) && (
            <p className="truncate text-[11px] text-muted-foreground">
              {error ? error : intervalLabel}
            </p>
          )}
        </div>
      </div>
      {onRefresh && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      )}
    </div>
  );
}
