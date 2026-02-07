"use client";

import { Badge } from "@/components/ui/badge";
import { COMPOUND_COLORS, COMPOUND_LABELS } from "@/lib/constants/compounds";

interface TireBadgeProps {
  compound: string;
  age?: number;
}

export function TireBadge({ compound, age }: TireBadgeProps) {
  const color = COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN;
  const label = COMPOUND_LABELS[compound] || "?";

  return (
    <Badge
      variant="outline"
      className="gap-1.5 font-mono text-xs"
    >
      <span
        className="inline-block h-3 w-3 rounded-full border border-border"
        style={{ backgroundColor: color }}
      />
      {label}
      {age !== undefined && (
        <span className="text-muted-foreground">L{age}</span>
      )}
    </Badge>
  );
}
