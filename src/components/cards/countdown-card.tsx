"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import type { Meeting } from "@/types/openf1";

interface CountdownCardProps {
  meeting: Meeting | null;
}

export function CountdownCard({ meeting }: CountdownCardProps) {
  const countdown = useCountdown(meeting?.date_start ?? null);

  if (!meeting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No upcoming race found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Next Race
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-bold">{meeting.meeting_name}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {meeting.location}, {meeting.country_name}
        </p>
        {countdown.isExpired ? (
          <p className="text-sm font-medium text-green-500">Race weekend is live!</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hrs" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Sec" },
            ].map((unit) => (
              <div key={unit.label}>
                <p className="text-2xl font-bold font-mono">{unit.value}</p>
                <p className="text-xs text-muted-foreground">{unit.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
