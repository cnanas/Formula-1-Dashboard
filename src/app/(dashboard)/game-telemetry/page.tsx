"use client";

import { useGameTelemetry } from "@/hooks/use-game-telemetry";
import { TelemetryPanel } from "@/components/live/telemetry-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Gamepad2 } from "lucide-react";

export default function GameTelemetryPage() {
  const { data, connected, error } = useGameTelemetry();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Game Telemetry</h1>
        <Badge variant={connected ? "default" : "secondary"}>
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Run the relay: <code className="text-xs">node scripts/telemetry-relay.js</code>
            </p>
          </CardContent>
        </Card>
      )}

      {!connected && !error && (
        <EmptyState
          icon={Gamepad2}
          title="Connect your F1 game"
          description="Run the relay (npm run relay), enable UDP telemetry in the F1 game, set UDP IP to 127.0.0.1 and port 20777, then enter a session."
        />
      )}

      {connected && (
        <TelemetryPanel
          carData={data}
          driverName="Game"
        />
      )}
    </div>
  );
}
