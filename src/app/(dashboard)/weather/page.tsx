"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenF1 } from "@/hooks/use-openf1";
import { SessionPicker } from "@/components/shared/session-picker";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CloudSun } from "lucide-react";
import { format } from "date-fns";

export default function WeatherPage() {
  const [meetingKey, setMeetingKey] = useState("");
  const [sessionKey, setSessionKey] = useState("");

  const { data: weather, isLoading } = useOpenF1(
    "weather",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Process weather data for charts
  const chartData = weather
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((w) => ({
      time: format(new Date(w.date), "HH:mm"),
      airTemp: w.air_temperature,
      trackTemp: w.track_temperature,
      humidity: w.humidity,
      windSpeed: w.wind_speed,
      rainfall: w.rainfall,
      pressure: w.pressure,
    }));

  return (
    <div className="space-y-6">
      <SessionPicker
        selectedMeeting={meetingKey}
        selectedSession={sessionKey}
        onMeetingChange={(key) => {
          setMeetingKey(key);
          setSessionKey("");
        }}
        onSessionChange={setSessionKey}
      />

      {!sessionKey ? (
        <EmptyState
          icon={CloudSun}
          title="Select a session"
          description="Choose a race weekend and session to view weather data."
        />
      ) : isLoading ? (
        <PageSkeleton />
      ) : chartData.length === 0 ? (
        <EmptyState
          icon={CloudSun}
          title="No weather data"
          description="No weather data available for this session."
        />
      ) : (
        <>
          {/* Temperature chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}°C`} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="airTemp" name="Air" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="trackTemp" name="Track" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Humidity & Wind */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Humidity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Line type="monotone" dataKey="humidity" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wind Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} className="fill-muted-foreground" />
                    <Tooltip
                      formatter={(value) => [`${value} km/h`, "Wind"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Line type="monotone" dataKey="windSpeed" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
