"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTeamColor } from "@/lib/utils/colors";

interface DriverAvatarProps {
  headshotUrl: string | null;
  nameAcronym: string;
  teamColour: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-xl",
};

export function DriverAvatar({
  headshotUrl,
  nameAcronym,
  teamColour,
  size = "md",
}: DriverAvatarProps) {
  const borderColor = getTeamColor(teamColour);

  return (
    <Avatar
      className={`${sizeClasses[size]} ring-2`}
      style={{ ["--tw-ring-color" as string]: borderColor }}
    >
      {headshotUrl && <AvatarImage src={headshotUrl} alt={nameAcronym} />}
      <AvatarFallback className="bg-muted text-muted-foreground font-mono font-bold">
        {nameAcronym}
      </AvatarFallback>
    </Avatar>
  );
}
