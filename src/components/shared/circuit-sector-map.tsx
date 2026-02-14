"use client";

import { useState, useEffect, useRef } from "react";
import { getTrackLayout } from "@/lib/constants/track-layouts";
import { getCircuitSlug } from "@/lib/constants/track-layouts";
import { cn } from "@/lib/utils";

const SECTOR_COLORS = ["#ef4444", "#06b6d4", "#eab308"]; // red, cyan, yellow (F1-style)

interface CircuitSectorMapProps {
  circuitShortName: string;
  className?: string;
}

export function CircuitSectorMap({ circuitShortName, className }: CircuitSectorMapProps) {
  const layout = getTrackLayout(circuitShortName);
  const circuitSlug = getCircuitSlug(circuitShortName);
  const [pathD, setPathD] = useState<string | null>(null);
  const [pathLength, setPathLength] = useState<number | null>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!layout?.svgPath) return;
    fetch(layout.svgPath)
      .then((r) => r.text())
      .then((text) => {
        const match = text.match(/\bd="([^"]+)"/);
        if (match) setPathD(match[1]);
      })
      .catch(() => {});
  }, [layout?.svgPath]);

  useEffect(() => {
    if (!pathRef.current || pathLength != null) return;
    const len = pathRef.current.getTotalLength();
    setPathLength(len);
  }, [pathD, pathLength]);

  if (!layout || !pathD) return null;

  const strokeWidth = 20;
  /**
   * Sector split points along the path, as fractions of total length.
   * These are circuit-specific so the colors land in the right places.
   * Fallback: equal thirds.
   *
   * Bahrain/Sakhir tuned to match F1-style sector placement.
   */
  const sectorConfig = (() => {
    if (circuitSlug === "bahrain" || circuitSlug === "sakhir") {
      // Bahrain: rotate to start/finish (bottom straight), then traverse in reverse path direction
      // so Sector 1 is left/outer, Sector 2 is inner, Sector 3 is right/outer (broadcast-style).
      // s2/s3 are cumulative sector starts from Sector 1 start, in [0..1] path fraction.
      return {
        start: 0.88,
        reverse: true,
        s2: 0.33,
        s3: 0.7,
      };
    }
    return {
      start: 0,
      reverse: false,
      s2: 1 / 3,
      s3: 2 / 3,
    };
  })();

  const s1 = pathLength != null ? sectorConfig.s2 * pathLength : 0;
  const s2 = pathLength != null ? (sectorConfig.s3 - sectorConfig.s2) * pathLength : 0;
  const s3 = pathLength != null ? Math.max(0, pathLength - s1 - s2) : 0;

  const baseOffset = pathLength != null ? sectorConfig.start * pathLength : 0;

  function mod(n: number, m: number) {
    return ((n % m) + m) % m;
  }

  const sectorLengths = [s1, s2, s3];

  // Build forward-direction dash segments for each sector.
  // If a sector crosses the path end, split it into two segments so wrapping renders correctly.
  const sectorRenderSegments = (() => {
    if (pathLength == null) return [[], [], []] as { start: number; length: number }[][];
    const lapDirection = sectorConfig.reverse ? -1 : 1;
    const lapStarts: number[] = [mod(baseOffset, pathLength)];

    for (let i = 1; i < sectorLengths.length; i += 1) {
      lapStarts[i] = mod(lapStarts[i - 1] + lapDirection * sectorLengths[i - 1], pathLength);
    }

    return sectorLengths.map((length, i) => {
      if (length <= 0) return [];
      const forwardStart = sectorConfig.reverse ? mod(lapStarts[i] - length, pathLength) : lapStarts[i];
      const end = forwardStart + length;

      if (end <= pathLength) {
        return [{ start: forwardStart, length }];
      }

      const first = pathLength - forwardStart;
      const second = length - first;
      return [
        { start: forwardStart, length: first },
        { start: 0, length: second },
      ].filter((segment) => segment.length > 0.01);
    });
  })();

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 500 500"
        className="w-full max-w-[140px] h-auto"
        aria-hidden
      >
        {/* Invisible path used only to measure length */}
        {pathLength == null && (
          <path ref={pathRef} d={pathD} fill="none" stroke="transparent" strokeWidth={strokeWidth} />
        )}
        {/* Sector 1 - Red */}
        {pathLength != null && (
          <>
            {sectorRenderSegments.map((segments, sectorIndex) =>
              segments.map((segment, segmentIndex) => (
                <path
                  key={`${sectorIndex}-${segmentIndex}`}
                  d={pathD}
                  fill="none"
                  stroke={SECTOR_COLORS[sectorIndex]}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${segment.length} ${pathLength}`}
                  strokeDashoffset={-segment.start}
                />
              ))
            )}
          </>
        )}
      </svg>
    </div>
  );
}
