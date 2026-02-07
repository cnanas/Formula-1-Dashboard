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

  const color = fillColor !== "none" ? fillColor : strokeColor;
  const widthScale = Math.min(Math.max(strokeWidth / 2.5, 0.9), 1.1);
  const maskSize = `${Math.round(widthScale * 100)}%`;

  return (
    <span
      aria-hidden="true"
      className={cn("block w-full h-full", className)}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${layout.svgPath})`,
        maskImage: `url(${layout.svgPath})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: `${maskSize} ${maskSize}`,
        maskSize: `${maskSize} ${maskSize}`,
      }}
    />
  );
}
