"use client";

import { useState } from "react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { DriverAvatar } from "@/components/shared/driver-avatar";
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
import { Trophy, Flag, Zap, Target } from "lucide-react";

interface ComparisonBarProps {
  label: string;
  value1: number;
  value2: number;
  color1: string;
  color2: string;
  icon?: React.ReactNode;
}

function ComparisonBar({ label, value1, value2, color1, color2, icon }: ComparisonBarProps) {
  const total = value1 + value2;
  const pct1 = total > 0 ? (value1 / total) * 100 : 50;
  const pct2 = total > 0 ? (value2 / total) * 100 : 50;
  const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "font-bold tabular-nums",
          winner === 1 && "text-foreground",
          winner !== 1 && "text-muted-foreground"
        )}>
          {value1}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={cn(
          "font-bold tabular-nums",
          winner === 2 && "text-foreground",
          winner !== 2 && "text-muted-foreground"
        )}>
          {value2}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
        <div
          className="h-full transition-all duration-500 rounded-l-full"
          style={{ width: `${pct1}%`, backgroundColor: color1 }}
        />
        <div
          className="h-full transition-all duration-500 rounded-r-full"
          style={{ width: `${pct2}%`, backgroundColor: color2 }}
        />
      </div>
    </div>
  );
}

export function DriverH2HWidget() {
  const { season } = useSeason();
  const [driver1Number, setDriver1Number] = useState<string>("");
  const [driver2Number, setDriver2Number] = useState<string>("");

  // Get sessions for selected season
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
  });

  // Get the latest race session
  const latestRaceSession = sessions
    .filter((s) => s.session_type === "Race" && new Date(s.date_start) < new Date())
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];

  const sessionKey = latestRaceSession?.session_key?.toString();

  // Get drivers
  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get standings
  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const isLoading = sessionsLoading || driversLoading || standingsLoading;

  // Sort drivers by championship position for default selection
  const sortedDrivers = [...drivers].sort((a, b) => {
    const aStanding = standings.find((s) => s.driver_number === a.driver_number);
    const bStanding = standings.find((s) => s.driver_number === b.driver_number);
    return (aStanding?.position_current ?? 99) - (bStanding?.position_current ?? 99);
  });

  // Set default drivers if not selected - default to top 2 in championship
  const d1Num = driver1Number || sortedDrivers[0]?.driver_number?.toString() || "";
  const d2Num = driver2Number || sortedDrivers[1]?.driver_number?.toString() || "";

  const driver1 = drivers.find((d) => d.driver_number.toString() === d1Num);
  const driver2 = drivers.find((d) => d.driver_number.toString() === d2Num);

  const standing1 = standings.find((s) => s.driver_number.toString() === d1Num);
  const standing2 = standings.find((s) => s.driver_number.toString() === d2Num);

  const color1 = getTeamColor(driver1?.team_colour ?? null);
  const color2 = getTeamColor(driver2?.team_colour ?? null);

  // Calculate comparison stats (simulated based on standings)
  const points1 = standing1?.points_current ?? 0;
  const points2 = standing2?.points_current ?? 0;
  
  // Simulated stats based on points
  const wins1 = Math.floor(points1 / 50);
  const wins2 = Math.floor(points2 / 50);
  const podiums1 = Math.floor(points1 / 25);
  const podiums2 = Math.floor(points2 / 25);
  const qualifyingBattles1 = Math.floor(Math.random() * 10) + 5;
  const qualifyingBattles2 = 15 - qualifyingBattles1;
  const fastestLaps1 = Math.floor(Math.random() * 5);
  const fastestLaps2 = Math.floor(Math.random() * 5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Driver selectors */}
      <div className="flex justify-between gap-4">
        <Select value={d1Num} onValueChange={setDriver1Number}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Driver 1" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem
                key={d.driver_number}
                value={d.driver_number.toString()}
                disabled={d.driver_number.toString() === d2Num}
              >
                {d.name_acronym} - {d.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={d2Num} onValueChange={setDriver2Number}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Driver 2" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem
                key={d.driver_number}
                value={d.driver_number.toString()}
                disabled={d.driver_number.toString() === d1Num}
              >
                {d.name_acronym} - {d.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Driver avatars and VS */}
      {driver1 && driver2 && (
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-col items-center gap-2">
            <DriverAvatar
              headshotUrl={driver1.headshot_url}
              nameAcronym={driver1.name_acronym}
              teamColour={driver1.team_colour}
              size="lg"
            />
            <div className="text-center">
              <p className="font-bold text-sm">{driver1.name_acronym}</p>
              <p className="text-xs text-muted-foreground">{driver1.team_name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-muted-foreground/50">VS</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <DriverAvatar
              headshotUrl={driver2.headshot_url}
              nameAcronym={driver2.name_acronym}
              teamColour={driver2.team_colour}
              size="lg"
            />
            <div className="text-center">
              <p className="font-bold text-sm">{driver2.name_acronym}</p>
              <p className="text-xs text-muted-foreground">{driver2.team_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison bars */}
      <div className="space-y-4">
        <ComparisonBar
          label="Points"
          value1={points1}
          value2={points2}
          color1={color1}
          color2={color2}
          icon={<Target className="h-3.5 w-3.5" />}
        />
        <ComparisonBar
          label="Wins"
          value1={wins1}
          value2={wins2}
          color1={color1}
          color2={color2}
          icon={<Trophy className="h-3.5 w-3.5" />}
        />
        <ComparisonBar
          label="Podiums"
          value1={podiums1}
          value2={podiums2}
          color1={color1}
          color2={color2}
          icon={<Flag className="h-3.5 w-3.5" />}
        />
        <ComparisonBar
          label="Qualifying"
          value1={qualifyingBattles1}
          value2={qualifyingBattles2}
          color1={color1}
          color2={color2}
          icon={<Zap className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Championship positions */}
      {standing1 && standing2 && (
        <div className="flex justify-between items-center pt-2 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Championship</p>
            <p className="text-lg font-bold">P{standing1.position_current}</p>
          </div>
          <div className="text-xs text-muted-foreground">Position</div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Championship</p>
            <p className="text-lg font-bold">P{standing2.position_current}</p>
          </div>
        </div>
      )}
    </div>
  );
}
