"use client";

import { useRef, useCallback, useEffect } from "react";
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
  const isTheorycrafted = setup.source === "theorycrafted";
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className={
            isTheorycrafted
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
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
        <Row label="Tires Q" value={setup.tiresQuali} />
        <Row label="Tires R" value={setup.tiresRace} />
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

const SWIPE_CLOSE_THRESHOLD_PX = 60;

export function SetupDetailSheet({
  trackName,
  circuitKey,
  setups,
  open,
  onOpenChange,
}: SetupDetailSheetProps) {
  const theme = CIRCUIT_THEMES[circuitKey] ?? CIRCUIT_THEMES.bahrain;
  const handleRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Touch event handlers for mobile swipe-to-close
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !open) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        dragStartY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default to stop any scroll behavior on the handle
      if (isDragging.current) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current || dragStartY.current === null) return;
      
      const touch = e.changedTouches[0];
      if (touch) {
        const deltaY = touch.clientY - dragStartY.current;
        if (deltaY > SWIPE_CLOSE_THRESHOLD_PX) {
          onOpenChange(false);
        }
      }
      
      dragStartY.current = null;
      isDragging.current = false;
    };

    const handleTouchCancel = () => {
      dragStartY.current = null;
      isDragging.current = false;
    };

    // Add touch event listeners with passive: false to allow preventDefault
    handle.addEventListener("touchstart", handleTouchStart, { passive: true });
    handle.addEventListener("touchmove", handleTouchMove, { passive: false });
    handle.addEventListener("touchend", handleTouchEnd, { passive: true });
    handle.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      handle.removeEventListener("touchstart", handleTouchStart);
      handle.removeEventListener("touchmove", handleTouchMove);
      handle.removeEventListener("touchend", handleTouchEnd);
      handle.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [open, onOpenChange]);

  // Mouse drag handlers for desktop - using document-level listeners for smooth dragging
  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || dragStartY.current === null) return;
      // Optional: could add visual feedback here during drag
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging.current || dragStartY.current === null) return;
      
      const deltaY = e.clientY - dragStartY.current;
      if (deltaY > SWIPE_CLOSE_THRESHOLD_PX) {
        onOpenChange(false);
      }
      
      dragStartY.current = null;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    // Add document-level listeners for mouse drag
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [open, onOpenChange]);

  // Mouse down handler for desktop drag initiation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    isDragging.current = true;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[800px] rounded-t-2xl p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Handle bar: swipe/drag down to close */}
        <div
          ref={handleRef}
          className="flex justify-center items-center pt-2 pb-4 shrink-0 select-none min-h-[2.5rem] cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          role="button"
          tabIndex={0}
          aria-label="Drag down to close"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenChange(false);
          }}
        >
          <div
            className="w-10 h-1 rounded-full bg-muted-foreground/30 pointer-events-none"
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
                F1 25 setups • {setups.length} source{setups.length !== 1 ? "s" : ""}
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
