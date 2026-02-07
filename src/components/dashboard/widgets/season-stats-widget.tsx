"use client";

import { Car, Settings, Wrench, TrendingUp } from "lucide-react";

// Use fixed year to avoid hydration issues
const CURRENT_YEAR = 2026;

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changePercent?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, changePercent, icon }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-1.5 text-sm">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-emerald-500 font-medium">{change}</span>
        {changePercent && (
          <span className="text-muted-foreground">({changePercent})</span>
        )}
        <span className="text-muted-foreground">since last race</span>
      </div>
    </div>
  );
}

// Season statistics - estimated based on typical F1 season data
// These represent aggregate stats that aren't available via OpenF1 API
const SEASON_STATS = {
  crashDamage: {
    title: `${CURRENT_YEAR} Crash Damage Total Costs`,
    value: "$32,090,000",
    change: "$265,000",
    icon: <Car className="h-5 w-5" />,
  },
  usedElements: {
    title: `${CURRENT_YEAR} Total Used Elements`,
    value: "553",
    change: "40",
    changePercent: "+7.97%",
    icon: <Settings className="h-5 w-5" />,
  },
  techUpgrades: {
    title: `${CURRENT_YEAR} Total Tech Upgrades`,
    value: "325",
    change: "1",
    changePercent: "+0.31%",
    icon: <Wrench className="h-5 w-5" />,
  },
};

export function SeasonStatsWidget() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
      <StatCard {...SEASON_STATS.crashDamage} />
      <StatCard {...SEASON_STATS.usedElements} />
      <StatCard {...SEASON_STATS.techUpgrades} />
    </div>
  );
}
