"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TrackOutline } from "@/components/shared/track-outline";
import { CIRCUIT_THEMES } from "@/lib/constants/circuits";
import type { GameSetup } from "@/types/setups";

interface SetupDetailSheetProps {
  trackName: string;
  circuitKey: string;
  setups: GameSetup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SetupCard({ setup }: { setup: GameSetup }) {
  const isTheorycrafted = setup.source === "theorycrafted"; // keep for reference below
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className={
            setup.source === "theorycrafted"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              : setup.source === "f1laps"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-sky-500/15 text-sky-700 dark:text-sky-400"
          }
        >
          {setup.createdBy ?? setup.source}
        </Badge>
      </div>
      <div className="grid gap-2 text-sm">
        <Row label="Aero" value={setup.aero} />
        <Row label="Differential" value={setup.differential} />
        <Row label="Susp. Geometry" value={setup.suspensionGeometry} />
        <Row label="Suspension" value={setup.suspension} />
        <Row label="Brakes" value={setup.brakes} />
        {setup.game !== "f126" && <Row label="Tires Q" value={setup.tiresQuali} />}
        <Row label={setup.game === "f126" ? "Tyres (PSI)" : "Tires R"} value={setup.tiresRace} />
        <Row label="Compounds" value={setup.compounds} />
        {setup.strategy && <Row label="Strategy" value={setup.strategy} />}
        {setup.laps && <Row label="Laps (50%)" value={setup.laps} />}
        {setup.notes && (
          <p className="text-muted-foreground mt-2 pt-2 border-t border-border">
            {setup.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-right break-all">{value}</span>
    </div>
  );
}

const SWIPE_CLOSE_THRESHOLD_PX = 80;
const MAX_DRAG_DISTANCE = 200;

export function SetupDetailSheet({
  trackName,
  circuitKey,
  setups,
  open,
  onOpenChange,
}: SetupDetailSheetProps) {
  const theme = CIRCUIT_THEMES[circuitKey] ?? CIRCUIT_THEMES.bahrain;
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Reset drag offset when sheet opens/closes
  useEffect(() => {
    if (!open) {
      setDragOffset(0);
    }
  }, [open]);

  // Unified handler for closing based on drag distance
  const handleDragEnd = useCallback((endY: number) => {
    const deltaY = endY - startY.current;
    if (deltaY > SWIPE_CLOSE_THRESHOLD_PX) {
      onOpenChange(false);
    }
    setDragOffset(0);
  }, [onOpenChange]);

  // Update drag offset for visual feedback
  const updateDragOffset = useCallback((currentY: number) => {
    const deltaY = Math.max(0, currentY - startY.current);
    // Clamp the drag distance and add resistance
    const clampedDelta = Math.min(deltaY, MAX_DRAG_DISTANCE);
    setDragOffset(clampedDelta);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    updateDragOffset(e.touches[0].clientY);
    // Prevent scrolling while dragging the handle
    e.preventDefault();
  }, [updateDragOffset]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.changedTouches[0];
    if (touch) {
      handleDragEnd(touch.clientY);
    }
    isDragging.current = false;
  }, [handleDragEnd]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startY.current = e.clientY;
    isDragging.current = true;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  // Document-level mouse listeners for desktop drag
  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      updateDragOffset(e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleDragEnd(e.clientY);
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Clean up styles on unmount
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [open, handleDragEnd, updateDragOffset]);

  // Calculate visual feedback styles
  const dragProgress = dragOffset / SWIPE_CLOSE_THRESHOLD_PX;
  const opacity = Math.max(0.3, 1 - dragProgress * 0.5);
  const scale = Math.max(0.95, 1 - dragProgress * 0.03);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetContentRef}
        side="bottom"
        className="h-[85vh] max-h-[800px] rounded-t-2xl p-0 flex flex-col transition-transform duration-75 ease-out"
        showCloseButton={false}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px) scale(${scale})` : undefined,
          opacity: dragOffset > 0 ? opacity : undefined,
        }}
      >
        {/* Handle bar: swipe/drag down to close */}
        <div
          className="flex justify-center items-center pt-3 pb-5 shrink-0 select-none min-h-[3rem] cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="Drag down to close"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenChange(false);
          }}
        >
          <div
            className={`w-12 h-1.5 rounded-full pointer-events-none transition-colors ${
              dragProgress > 0.5 ? "bg-red-400" : "bg-muted-foreground/40"
            }`}
            aria-hidden
          />
        </div>
        <SheetHeader className="px-6 pb-4 shrink-0 border-b border-border relative">
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
          <div className="flex items-center gap-4 pr-10">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <TrackOutline
                circuitShortName={circuitKey}
                className="w-7 h-7"
                strokeColor={theme.primaryColor}
              />
            </div>
            <div>
              <SheetTitle className="text-xl">{trackName}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {setups[0]?.game === "f126" ? "F1 26" : "F1 25"} setups • {setups.length} source{setups.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4 overscroll-contain">
          <div className="space-y-4 pb-8">
            {setups.map((setup) => (
              <SetupCard key={`${setup.source}-${setup.track}`} setup={setup} />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
