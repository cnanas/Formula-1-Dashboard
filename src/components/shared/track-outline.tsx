"use client";

import { getTrackLayout } from "@/lib/constants/track-layouts";
import { cn } from "@/lib/utils";

interface TrackOutlineProps {
  circuitShortName: string;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export function TrackOutline({
  circuitShortName,
  className,
  strokeColor = "currentColor",
  strokeWidth = 2.5,
  fillColor = "none",
}: TrackOutlineProps) {
  const layout = getTrackLayout(circuitShortName);

  if (!layout) return null;

  return (
    <svg
      viewBox={layout.viewBox}
      className={cn("w-full h-full", className)}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={layout.path} />
    </svg>
  );
}
