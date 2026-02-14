"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Palette, Check, RotateCcw, PanelBottom, PanelLeft, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";
import { useNavigationMode } from "@/providers/navigation-mode-provider";
import { CIRCUIT_THEMES, getTeamColors } from "@/lib/constants/circuits";

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();
  const {
    theme,
    themeMode,
    selectedTeam,
    setTeamTheme,
    setCircuitTheme,
    resetToDefault,
    availableTeams,
  } = useCircuitTheme();
  const { mode: navMode, setMode: setNavMode } = useNavigationMode();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Palette className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          {/* Color indicator dot */}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
            style={{ backgroundColor: theme.primaryColor }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setAppTheme("light")} className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Light
          </span>
          {appTheme === "light" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAppTheme("dark")} className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Dark
          </span>
          {appTheme === "dark" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAppTheme("system")} className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System
          </span>
          {appTheme === "system" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Team Themes */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  background: themeMode === "team" ? theme.primaryColor : "#666",
                }}
              />
              Team Colors
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
            {availableTeams.map((teamName) => (
              <DropdownMenuItem
                key={teamName}
                onClick={() => setTeamTheme(teamName)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <TeamColorDot teamName={teamName} />
                  <span className="text-sm">{teamName}</span>
                </span>
                {selectedTeam === teamName && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Circuit Themes */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  background:
                    themeMode === "circuit" ? theme.primaryColor : "#666",
                }}
              />
              Circuit Themes
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
            {Object.values(CIRCUIT_THEMES).map((circuit) => (
              <DropdownMenuItem
                key={circuit.id}
                onClick={() => setCircuitTheme(circuit.id)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: circuit.primaryColor }}
                  />
                  <span className="text-sm">
                    {circuit.country || circuit.name}
                  </span>
                </span>
                {themeMode === "circuit" && theme.id === circuit.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Navigation Mode */}
        <DropdownMenuLabel>Navigation</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setNavMode("sidebar")}
          className="flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <PanelLeft className="h-4 w-4" />
            Sidebar
          </span>
          {navMode === "sidebar" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setNavMode("bottom")}
          className="flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <PanelBottom className="h-4 w-4" />
            Bottom Pill
          </span>
          {navMode === "bottom" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Reset to default */}
        <DropdownMenuItem onClick={resetToDefault}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Theme
        </DropdownMenuItem>

        {/* Current theme indicator */}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">Theme: {theme.name}</p>
          <div className="flex gap-1 mt-1">
            <span
              className="h-4 w-4 rounded"
              style={{ backgroundColor: theme.primaryColor }}
              title="Primary"
            />
            <span
              className="h-4 w-4 rounded"
              style={{ backgroundColor: theme.secondaryColor }}
              title="Secondary"
            />
            <span
              className="h-4 w-4 rounded border"
              style={{ backgroundColor: theme.accentColor }}
              title="Accent"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeamColorDot({ teamName }: { teamName: string }) {
  const colors = getTeamColors(teamName);

  return (
    <span
      className="h-3 w-3 rounded-full"
      style={{ backgroundColor: colors.primary }}
    />
  );
}
