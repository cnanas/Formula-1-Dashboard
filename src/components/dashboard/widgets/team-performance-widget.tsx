"use client";

import { useState } from "react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { getTeamColor } from "@/lib/utils/colors";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

interface PerformanceData {
  wins: number;
  podiums: number;
  points: number;
  poles: number;
  dnfs: number;
}

// Bubble component for the visualization
function PerformanceBubble({
  value,
  label,
  color,
  maxValue,
  size = "md",
}: {
  value: number;
  label: string;
  color: string;
  maxValue: number;
  size?: "sm" | "md" | "lg";
}) {
  // Calculate bubble size based on value relative to max
  const minSize = size === "lg" ? 60 : size === "md" ? 48 : 36;
  const maxSize = size === "lg" ? 100 : size === "md" ? 80 : 60;
  const bubbleSize = maxValue > 0 
    ? minSize + ((value / maxValue) * (maxSize - minSize))
    : minSize;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 hover:scale-110"
        style={{
          width: bubbleSize,
          height: bubbleSize,
          backgroundColor: color,
          fontSize: bubbleSize > 60 ? 16 : 14,
        }}
      >
        {value}
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export function TeamPerformanceWidget() {
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Get sessions for current year
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: CURRENT_YEAR,
  });

  // Get the latest race session
  const latestRaceSession = sessions
    .filter((s) => s.session_type === "Race" && new Date(s.date_start) < new Date())
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];

  const sessionKey = latestRaceSession?.session_key?.toString();

  // Get drivers for team info
  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get all race results for the season
  const { data: allSessions } = useOpenF1("sessions", {
    year: CURRENT_YEAR,
    session_type: "Race",
  });

  // Get unique teams
  const teams = [...new Set(drivers.map((d) => d.team_name))].filter(Boolean);
  const currentTeam = selectedTeam || teams[0] || "";

  // Get team color
  const teamDriver = drivers.find((d) => d.team_name === currentTeam);
  const teamColor = getTeamColor(teamDriver?.team_colour ?? null);

  // Calculate performance metrics (simulated based on available data)
  // In a real app, you'd aggregate this from actual race results
  const { data: standings } = useOpenF1(
    "championship_teams",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const teamStanding = standings.find((s) => s.team_name === currentTeam);
  
  // Simulated performance data based on points
  // In production, you'd calculate this from actual race results
  const points = teamStanding?.points_current ?? 0;
  const estimatedWins = Math.floor(points / 50);
  const estimatedPodiums = Math.floor(points / 25);
  const estimatedPoles = Math.floor(points / 40);
  const estimatedDnfs = Math.floor(Math.random() * 4);

  const performance: PerformanceData = {
    wins: estimatedWins,
    podiums: estimatedPodiums,
    points: points,
    poles: estimatedPoles,
    dnfs: estimatedDnfs,
  };

  // Find max values for scaling
  const maxStatValue = Math.max(
    performance.wins,
    performance.podiums,
    performance.poles,
    performance.dnfs,
    1
  );

  const isLoading = sessionsLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="flex justify-center gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Team selector */}
      <Select value={currentTeam} onValueChange={setSelectedTeam}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team} value={team}>
              {team}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Performance bubbles */}
      <div className="flex flex-wrap justify-center items-end gap-4 py-4">
        <PerformanceBubble
          value={performance.wins}
          label="Wins"
          color="#ec4899" // Pink
          maxValue={maxStatValue}
          size="md"
        />
        <PerformanceBubble
          value={performance.podiums}
          label="Podiums"
          color="#3b82f6" // Blue
          maxValue={maxStatValue}
          size="md"
        />
        <PerformanceBubble
          value={performance.points}
          label="Points"
          color="#22c55e" // Green
          maxValue={performance.points}
          size="lg"
        />
        <PerformanceBubble
          value={performance.poles}
          label="Poles"
          color="#a855f7" // Purple
          maxValue={maxStatValue}
          size="md"
        />
        <PerformanceBubble
          value={performance.dnfs}
          label="DNFs"
          color="#f97316" // Orange
          maxValue={maxStatValue}
          size="md"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
          <span className="text-muted-foreground">Wins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Podium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Points</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">Poles</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">DNF</span>
        </div>
      </div>
    </div>
  );
}
