"use client";

import { Car, TrendingUp } from "lucide-react";
import { useSeason } from "@/providers/season-provider";

export function CrashDamageWidget() {
  const { season } = useSeason();

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {season} Crash Damage Total Costs
        </p>
        <Car className="h-5 w-5 text-muted-foreground/50 shrink-0" />
      </div>
      <p className="text-4xl font-bold tracking-tight">$32,090,000</p>
      <div className="flex items-center gap-1.5 text-sm">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-emerald-500 font-medium">$265,000</span>
        <span className="text-muted-foreground">since last race</span>
      </div>
    </div>
  );
}
