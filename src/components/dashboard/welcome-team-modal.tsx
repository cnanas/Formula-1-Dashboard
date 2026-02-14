"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTeamFilter } from "@/providers/team-filter-provider";
import { TEAM_LOGOS } from "@/lib/constants/team-logos";

const STORAGE_KEY = "f1dash_welcome_seen";

// Unique teams to show (normalized names to match OpenF1 team filter values)
const WELCOME_TEAMS = [
  "Red Bull Racing",
  "McLaren",
  "Ferrari",
  "Mercedes",
  "Aston Martin",
  "Alpine",
  "Williams",
  "Racing Bulls",
  "Kick Sauber",
  "Haas F1 Team",
  "Audi",
  "Cadillac",
] as const;

function getTeamLogoUrl(team: string): string | null {
  return TEAM_LOGOS[team] ?? null;
}

export function WelcomeTeamModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setSelectedTeam } = useTeamFilter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setOpen(true);
      }
    } catch {
      // Ignore
    }
  }, [mounted]);

  const handleSelectTeam = (team: string) => {
    setSelectedTeam(team);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    setOpen(false);
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    setOpen(false);
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleSkip}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            Pick your team
          </DialogTitle>
          <DialogDescription className="text-center">
            Select your favorite team to personalize your dashboard. You can
            change this anytime from the header.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4">
          {WELCOME_TEAMS.map((team) => {
            const logoUrl = getTeamLogoUrl(team);
            return (
              <button
                key={team}
                type="button"
                onClick={() => handleSelectTeam(team)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/50 transition-colors group"
              >
                <div className="relative h-16 w-16 flex items-center justify-center rounded-lg bg-background overflow-hidden">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={team}
                      width={64}
                      height={64}
                      className="object-contain p-1.5 group-hover:scale-110 transition-transform"
                      unoptimized
                    />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {team.slice(0, 2)}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {team}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
