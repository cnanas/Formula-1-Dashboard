"use client";

import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Weather } from "@/types/openf1";

interface WeatherWidgetProps {
  weather: Weather | null;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No weather data</p>
        </CardContent>
      </Card>
    );
  }

  const conditions = [
    {
      icon: Thermometer,
      label: "Air",
      value: `${weather.air_temperature}°C`,
    },
    {
      icon: Thermometer,
      label: "Track",
      value: `${weather.track_temperature}°C`,
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.humidity}%`,
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${weather.wind_speed} km/h`,
    },
    {
      icon: CloudRain,
      label: "Rain",
      value: weather.rainfall > 0 ? "Yes" : "No",
    },
    {
      icon: Gauge,
      label: "Pressure",
      value: `${weather.pressure} hPa`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {conditions.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <c.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-sm font-medium">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
