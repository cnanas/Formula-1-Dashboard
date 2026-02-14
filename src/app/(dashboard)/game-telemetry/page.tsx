"use client";

import { useGameTelemetry } from "@/hooks/use-game-telemetry";
import { TelemetryPanel } from "@/components/live/telemetry-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionSummaryCard } from "@/components/live/session-summary-card";
import { Gamepad2, Flag } from "lucide-react";

export default function GameTelemetryPage() {
  const { data, summary, connected, error } = useGameTelemetry();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Game Telemetry</h1>
          <Badge
            variant={connected ? (data ? "default" : "secondary") : "secondary"}
            className={connected && data ? "" : "font-normal"}
          >
            {connected ? (data ? "Game connected" : "Relay connected") : "Disconnected"}
          </Badge>
        </div>
        {connected && !data && (
          <p className="text-sm text-muted-foreground">
            Connected to the relay. Start your F1 game and enter a session to see live data.
          </p>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Run the relay on your PC (see instructions below), then open this page from the same device.
            </p>
          </CardContent>
        </Card>
      )}

      {!connected && !error && (
        <EmptyState
          icon={Gamepad2}
          title="Connect your F1 game"
          description="Run the relay on your PC (see instructions below), then open this page from the same device."
        />
      )}

      {(!connected || !data) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to use Game Telemetry (web)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong className="text-foreground">Start the relay</strong> (same machine where you will open this page):
                <ul className="list-disc list-inside mt-1.5 ml-2 space-y-0.5 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Easiest:</strong> open this project folder and double-click{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">run-relay.command</code> (Mac) or{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">run-relay.bat</code> (Windows). Keep that window open.
                  </li>
                  <li>
                    Or in a terminal: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run relay</code>
                  </li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">Open this dashboard</strong> in your browser on that same PC (this URL or localhost).
              </li>
              <li>
                <strong className="text-foreground">In the F1 game</strong> (PC, PS5, or Xbox): go to Settings → Telemetry. Turn <strong className="text-foreground">UDP Telemetry</strong> On. Set <strong className="text-foreground">UDP IP</strong> to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">127.0.0.1</code> (game on same PC) or your PC’s IP (e.g. 192.168.1.x) if the game is on another device. Set <strong className="text-foreground">UDP Port</strong> to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">20777</code>. Set <strong className="text-foreground">UDP Format</strong> to 2024 or 2025. Enter a session (Practice, Qualifying, or Race).
              </li>
              <li>
                When you <strong className="text-foreground">finish your session or race</strong>, a summary card will appear here with your position, best lap, total time, and more.
              </li>
              <li>
                <strong className="text-foreground">Discord (optional):</strong> add{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DISCORD_WEBHOOK_URL</code> to a{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code> file in this project, then restart the relay. The relay will post that same summary to your Discord channel after each session.
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {connected && summary && (
        <SessionSummaryCard summary={summary} />
      )}

      {connected && !summary && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Flag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Session summary will appear here</p>
            <p className="text-sm text-muted-foreground mt-1">
              Finish your race or session to see your result card (position, best lap, total time, pit stops).
            </p>
          </CardContent>
        </Card>
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
