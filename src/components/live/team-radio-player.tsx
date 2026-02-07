"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Play, Pause, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TeamRadio, Driver } from "@/types/openf1";

interface TeamRadioPlayerProps {
  radios: TeamRadio[];
  drivers: Driver[];
}

export function TeamRadioPlayer({ radios, drivers }: TeamRadioPlayerProps) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  const sorted = [...radios].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function handlePlay(url: string) {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingUrl(null);
    audioRef.current = audio;
    setPlayingUrl(url);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Team Radio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No team radio messages
            </p>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((radio, i) => {
                const driver = driverMap.get(radio.driver_number);
                const isPlaying = playingUrl === radio.recording_url;

                return (
                  <div
                    key={`${radio.date}-${i}`}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handlePlay(radio.recording_url)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {driver?.broadcast_name ?? `Driver #${radio.driver_number}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(radio.date), "HH:mm:ss")}
                      </p>
                    </div>
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: driver?.team_colour
                          ? `#${driver.team_colour}`
                          : "#888",
                      }}
                    />
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
