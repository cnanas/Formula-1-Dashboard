"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CarData } from "@/types/openf1";

interface TelemetryPanelProps {
  carData: CarData | null;
  driverName: string;
}

export function TelemetryPanel({ carData, driverName }: TelemetryPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Telemetry
          <Badge variant="outline" className="font-mono">
            {driverName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!carData ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No telemetry data available
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Speed */}
            <TelemetryGauge
              label="Speed"
              value={carData.speed}
              max={370}
              unit="km/h"
              color="#3b82f6"
            />

            {/* RPM */}
            <TelemetryGauge
              label="RPM"
              value={carData.rpm}
              max={15000}
              unit=""
              color="#f59e0b"
            />

            {/* Throttle */}
            <TelemetryBar
              label="Throttle"
              value={carData.throttle}
              max={100}
              color="#22c55e"
            />

            {/* Brake */}
            <TelemetryBar
              label="Brake"
              value={carData.brake}
              max={100}
              color="#ef4444"
            />

            {/* Gear */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Gear</p>
              <p className="text-4xl font-bold font-mono">
                {carData.n_gear === 0 ? "N" : carData.n_gear}
              </p>
            </div>

            {/* DRS */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">DRS</p>
              <Badge
                variant={carData.drs >= 10 ? "default" : "secondary"}
                className={`text-lg px-4 py-1 ${
                  carData.drs >= 10
                    ? "bg-green-500 hover:bg-green-500"
                    : ""
                }`}
              >
                {carData.drs >= 10 ? "OPEN" : "OFF"}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TelemetryGauge({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono">
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </p>
      <div className="h-1.5 w-full rounded-full bg-muted mt-1">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function TelemetryBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xs font-mono">{Math.round(value)}%</p>
      </div>
      <div className="h-3 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
