"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { getTeamColor } from "@/lib/utils/colors";
import { getTeamLogoUrl } from "@/lib/constants/team-logos";
import { getTeamLiveryUrl } from "@/lib/constants/team-liveries";
import { getTeamCarModel } from "@/lib/constants/team-car-models";

interface TeamCardProps {
  teamName: string;
  drivers: Array<{
    driver_number: number;
    full_name: string;
    name_acronym: string;
    headshot_url: string | null;
    team_colour: string | null;
  }>;
  position?: number;
  points?: number;
  index: number;
}

export function TeamCard({
  teamName,
  drivers,
  position,
  points,
  index,
}: TeamCardProps) {
  const teamColor = getTeamColor(drivers[0]?.team_colour ?? null);
  const logoUrl = getTeamLogoUrl(teamName);
  const liveryUrl = getTeamLiveryUrl(teamName);
  const carModel = getTeamCarModel(teamName);

  return (
    <Link href={`/teams/${encodeURIComponent(teamName)}`}>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:border-border hover:shadow-md hover:shadow-black/5"
      >
        {/* Livery image area with logo watermark */}
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted/50">
          <Image
            src={liveryUrl}
            alt={`${teamName} livery`}
            fill
            className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {logoUrl && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-[0.12] transition-opacity group-hover:opacity-[0.18]"
              aria-hidden
            >
              <Image
                src={logoUrl}
                alt=""
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
          )}
          {/* Drivers overlay - top right */}
          <div className="absolute right-3 top-3 flex -space-x-2">
            {drivers.slice(0, 2).map((driver) => (
              <div
                key={driver.driver_number}
                className="ring-2 ring-background rounded-full"
              >
                <DriverAvatar
                  headshotUrl={driver.headshot_url}
                  nameAcronym={driver.name_acronym}
                  teamColour={driver.team_colour}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Team info */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className="font-semibold text-base truncate transition-colors group-hover:text-foreground"
                style={{ color: teamColor }}
              >
                {teamName}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {carModel}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {(position != null || points != null) && (
            <div className="flex items-center gap-3 text-sm">
              {position != null && (
                <span className="font-mono font-medium">
                  P{position}
                </span>
              )}
              {points != null && (
                <span className="text-muted-foreground">
                  {points} pts
                </span>
              )}
            </div>
          )}
        </div>

        {/* Accent bar */}
        <div
          className="h-1 w-full shrink-0"
          style={{ backgroundColor: teamColor }}
        />
      </motion.article>
    </Link>
  );
}
