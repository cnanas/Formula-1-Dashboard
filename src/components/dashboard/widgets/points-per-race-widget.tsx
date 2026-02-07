"use client";

import { PointsPerRaceChart } from "@/components/charts/points-per-race-chart";

export function PointsPerRaceWidget() {
  return <PointsPerRaceChart maxDrivers={5} />;
}
