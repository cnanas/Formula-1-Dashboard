"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenF1 } from "@/hooks/use-openf1";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { formatLapTime } from "@/lib/utils/formatting";
import { getTeamColor } from "@/lib/utils/colors";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { GitCompareArrows } from "lucide-react";

export default function ComparePage() {
  const [driver1, setDriver1] = useState<string>("");
  const [driver2, setDriver2] = useState<string>("");
  const [meetingKey, setMeetingKey] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const { data: meetings } = useOpenF1("meetings", { year: currentYear });
  const { data: drivers, isLoading: driversLoading } = useOpenF1("drivers", {
    session_key: "latest",
  });
  const { data: standings } = useOpenF1("championship_drivers", {
    session_key: "latest",
  });

  // Fetch race-specific data if meeting is selected
  const { data: sessions } = useOpenF1(
    "sessions",
    { meeting_key: meetingKey, session_type: "Race" },
    { enabled: !!meetingKey }
  );
  const raceSessionKey = sessions[0]?.session_key;

  const { data: laps } = useOpenF1(
    "laps",
    { session_key: raceSessionKey?.toString() },
    { enabled: !!raceSessionKey }
  );

  const { data: results } = useOpenF1(
    "session_result",
    { session_key: raceSessionKey?.toString() },
    { enabled: !!raceSessionKey }
  );

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const standingsMap = new Map(
    standings.map((s) => [s.driver_number, s])
  );

  const d1 = driver1 ? driverMap.get(Number(driver1)) : null;
  const d2 = driver2 ? driverMap.get(Number(driver2)) : null;
  const s1 = driver1 ? standingsMap.get(Number(driver1)) : null;
  const s2 = driver2 ? standingsMap.get(Number(driver2)) : null;

  if (driversLoading) return <PageSkeleton />;

  // Calculate lap stats for each driver in selected race
  const d1Laps = laps.filter((l) => l.driver_number === Number(driver1));
  const d2Laps = laps.filter((l) => l.driver_number === Number(driver2));
  const d1Result = results.find((r) => r.driver_number === Number(driver1));
  const d2Result = results.find((r) => r.driver_number === Number(driver2));

  const d1BestLap = d1Laps
    .filter((l) => l.lap_duration && !l.is_pit_out_lap)
    .reduce(
      (best, l) => (l.lap_duration! < (best ?? Infinity) ? l.lap_duration! : best),
      null as number | null
    );
  const d2BestLap = d2Laps
    .filter((l) => l.lap_duration && !l.is_pit_out_lap)
    .reduce(
      (best, l) => (l.lap_duration! < (best ?? Infinity) ? l.lap_duration! : best),
      null as number | null
    );

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        <Select value={driver1} onValueChange={setDriver1}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Driver 1" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem
                key={d.driver_number}
                value={d.driver_number.toString()}
              >
                {d.name_acronym} - {d.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="self-center text-muted-foreground font-medium">
          vs
        </span>

        <Select value={driver2} onValueChange={setDriver2}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Driver 2" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem
                key={d.driver_number}
                value={d.driver_number.toString()}
              >
                {d.name_acronym} - {d.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={meetingKey} onValueChange={setMeetingKey}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select race (optional)" />
          </SelectTrigger>
          <SelectContent>
            {meetings.map((m) => (
              <SelectItem
                key={m.meeting_key}
                value={m.meeting_key.toString()}
              >
                {m.meeting_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comparison */}
      {!d1 || !d2 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Select two drivers"
          description="Choose two drivers above to see their head-to-head comparison."
        />
      ) : (
        <div className="space-y-4">
          {/* Driver cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <DriverCompareCard
              driver={d1}
              standing={s1}
              racePosition={d1Result?.position}
              bestLap={d1BestLap}
            />
            <DriverCompareCard
              driver={d2}
              standing={s2}
              racePosition={d2Result?.position}
              bestLap={d2BestLap}
            />
          </div>

          {/* Stat comparison bars */}
          {s1 && s2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Season Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ComparisonBar
                  label="Championship Points"
                  value1={s1.points_current}
                  value2={s2.points_current}
                  name1={d1.name_acronym}
                  name2={d2.name_acronym}
                  color1={getTeamColor(d1.team_colour)}
                  color2={getTeamColor(d2.team_colour)}
                />
                <ComparisonBar
                  label="Championship Position"
                  value1={s1.position_current}
                  value2={s2.position_current}
                  name1={d1.name_acronym}
                  name2={d2.name_acronym}
                  color1={getTeamColor(d1.team_colour)}
                  color2={getTeamColor(d2.team_colour)}
                  lowerIsBetter
                />
                {d1BestLap && d2BestLap && (
                  <ComparisonBar
                    label="Best Lap (selected race)"
                    value1={d1BestLap}
                    value2={d2BestLap}
                    name1={d1.name_acronym}
                    name2={d2.name_acronym}
                    color1={getTeamColor(d1.team_colour)}
                    color2={getTeamColor(d2.team_colour)}
                    lowerIsBetter
                    formatter={formatLapTime}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function DriverCompareCard({
  driver,
  standing,
  racePosition,
  bestLap,
}: {
  driver: { headshot_url: string | null; name_acronym: string; full_name: string; team_name: string; team_colour: string | null };
  standing?: { points_current: number; position_current: number } | null;
  racePosition?: number;
  bestLap?: number | null;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <DriverAvatar
            headshotUrl={driver.headshot_url}
            nameAcronym={driver.name_acronym}
            teamColour={driver.team_colour}
            size="lg"
          />
          <div>
            <h3 className="font-bold text-lg">{driver.full_name}</h3>
            <p className="text-sm text-muted-foreground">{driver.team_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Points</p>
            <p className="text-xl font-bold font-mono">
              {standing?.points_current ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Position</p>
            <p className="text-xl font-bold font-mono">
              P{standing?.position_current ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Lap</p>
            <p className="text-xl font-bold font-mono">
              {bestLap ? formatLapTime(bestLap) : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonBar({
  label,
  value1,
  value2,
  name1,
  name2,
  color1,
  color2,
  lowerIsBetter = false,
  formatter,
}: {
  label: string;
  value1: number;
  value2: number;
  name1: string;
  name2: string;
  color1: string;
  color2: string;
  lowerIsBetter?: boolean;
  formatter?: (v: number) => string;
}) {
  const total = value1 + value2;
  const pct1 = total > 0 ? (value1 / total) * 100 : 50;
  const formatValue = formatter ?? ((v: number) => String(v));

  const d1Better = lowerIsBetter ? value1 < value2 : value1 > value2;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-mono w-20 text-left ${
            d1Better ? "font-bold" : ""
          }`}
        >
          {name1}: {formatValue(value1)}
        </span>
        <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-l-full transition-all"
            style={{ width: `${pct1}%`, backgroundColor: color1 }}
          />
          <div
            className="h-full rounded-r-full transition-all"
            style={{ width: `${100 - pct1}%`, backgroundColor: color2 }}
          />
        </div>
        <span
          className={`text-sm font-mono w-20 text-right ${
            !d1Better ? "font-bold" : ""
          }`}
        >
          {formatValue(value2)} :{name2}
        </span>
      </div>
    </div>
  );
}
