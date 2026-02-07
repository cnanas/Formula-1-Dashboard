"use client";

import { Badge } from "@/components/ui/badge";
import { getTeamColor } from "@/lib/utils/colors";

interface TeamBadgeProps {
  teamName: string;
  teamColour: string | null;
}

export function TeamBadge({ teamName, teamColour }: TeamBadgeProps) {
  const color = getTeamColor(teamColour);

  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {teamName}
    </Badge>
  );
}
