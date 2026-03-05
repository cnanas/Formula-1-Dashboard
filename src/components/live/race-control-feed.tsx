"use client";

import { parseApiDate } from "@/lib/utils/formatting";
import { Flag, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FLAG_COLORS } from "@/lib/constants/flags";
import type { RaceControl } from "@/types/openf1";

interface RaceControlFeedProps {
  messages: RaceControl[];
}

export function RaceControlFeed({ messages }: RaceControlFeedProps) {
  const sorted = [...messages].sort(
    (a, b) => (parseApiDate(b.date)?.getTime() ?? 0) - (parseApiDate(a.date)?.getTime() ?? 0)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Race Control</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No messages yet
            </p>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((msg, i) => {
                const flagColor = msg.flag
                  ? FLAG_COLORS[msg.flag] ?? "#888"
                  : null;

                return (
                  <div key={`${msg.date}-${i}`} className="flex gap-3 px-4 py-2.5">
                    <div className="shrink-0 mt-0.5">
                      {flagColor ? (
                        <Flag
                          className="h-4 w-4"
                          style={{ color: flagColor }}
                        />
                      ) : msg.category === "SafetyCar" ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Info className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{msg.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {(parseApiDate(msg.date) ?? new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        {msg.lap_number && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            Lap {msg.lap_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
