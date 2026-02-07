"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { ComparisonRadarChart } from "@/components/ui/radar-chart";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ProgressRing } from "@/components/ui/progress-ring";

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

          {/* Radar Chart Comparison */}
          {s1 && s2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Performance Radar
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ComparisonRadarChart
                    data1={[
                      Math.min(100, (s1.points_current / Math.max(s1.points_current, s2.points_current)) * 100),
                      Math.min(100, ((21 - s1.position_current) / 20) * 100),
                      d1BestLap && d2BestLap ? Math.min(100, (d2BestLap / d1BestLap) * 100) : 50,
                      d1Laps.length > 0 ? Math.min(100, (d1Laps.length / Math.max(d1Laps.length, d2Laps.length)) * 100) : 50,
                      d1Result?.position ? Math.min(100, ((21 - d1Result.position) / 20) * 100) : 50,
                    ]}
                    data2={[
                      Math.min(100, (s2.points_current / Math.max(s1.points_current, s2.points_current)) * 100),
                      Math.min(100, ((21 - s2.position_current) / 20) * 100),
                      d1BestLap && d2BestLap ? Math.min(100, (d1BestLap / d2BestLap) * 100) : 50,
                      d2Laps.length > 0 ? Math.min(100, (d2Laps.length / Math.max(d1Laps.length, d2Laps.length)) * 100) : 50,
                      d2Result?.position ? Math.min(100, ((21 - d2Result.position) / 20) * 100) : 50,
                    ]}
                    labels={["Points", "Championship", "Pace", "Consistency", "Race Result"]}
                    label1={d1.name_acronym}
                    label2={d2.name_acronym}
                    color1={getTeamColor(d1.team_colour)}
                    color2={getTeamColor(d2.team_colour)}
                    size={280}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stat comparison bars */}
          {s1 && s2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
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
            </motion.div>
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
  const teamColor = getTeamColor(driver.team_colour);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        {/* Team color accent bar */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: teamColor }}
        />
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
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Points</p>
              {standing?.points_current !== undefined ? (
                <AnimatedCounter
                  value={standing.points_current}
                  duration={1.2}
                  className="text-2xl font-bold"
                />
              ) : (
                <span className="text-2xl font-bold">-</span>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Position</p>
              {standing?.position_current !== undefined ? (
                <div className="flex items-baseline justify-center">
                  <span className="text-sm text-muted-foreground">P</span>
                  <AnimatedCounter
                    value={standing.position_current}
                    duration={0.8}
                    className="text-2xl font-bold"
                  />
                </div>
              ) : (
                <span className="text-2xl font-bold">-</span>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Best Lap</p>
              <p className="text-xl font-bold font-mono">
                {bestLap ? formatLapTime(bestLap) : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
          className={`text-sm font-mono w-24 text-left ${
            d1Better ? "font-bold" : ""
          }`}
          style={{ color: d1Better ? color1 : undefined }}
        >
          {name1}: {formatValue(value1)}
        </span>
        <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-full rounded-l-full"
            style={{ backgroundColor: color1 }}
            initial={{ width: 0 }}
            animate={{ width: `${pct1}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div
            className="h-full rounded-r-full"
            style={{ backgroundColor: color2 }}
            initial={{ width: 0 }}
            animate={{ width: `${100 - pct1}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
        <span
          className={`text-sm font-mono w-24 text-right ${
            !d1Better ? "font-bold" : ""
          }`}
          style={{ color: !d1Better ? color2 : undefined }}
        >
          {formatValue(value2)} :{name2}
        </span>
      </div>
    </div>
  );
}
