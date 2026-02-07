"use client";

import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isEditing?: boolean;
  onRemove?: () => void;
  /** Optional right-side header content (e.g., tabs, toggles) */
  headerAction?: React.ReactNode;
  /** Remove padding from content area */
  noPadding?: boolean;
  /** Hide the header (title/subtitle) - widget handles its own header */
  noHeader?: boolean;
  /** Custom class for the card */
  className?: string;
}

export function WidgetWrapper({
  title,
  subtitle,
  children,
  isEditing,
  onRemove,
  headerAction,
  noPadding,
  noHeader,
  className,
}: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        "h-full flex flex-col overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm",
        isEditing && "ring-2 ring-primary/20",
        className
      )}
    >
      {/* Header */}
      {noHeader ? (
        isEditing && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            <GripVertical className="drag-handle h-5 w-5 text-white/70 cursor-grab active:cursor-grabbing drop-shadow" />
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/70 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      ) : (
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {isEditing && (
              <GripVertical className="drag-handle h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
            )}
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            {isEditing && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn("flex-1 overflow-auto", !noPadding && "px-5 pb-5", noHeader && "p-0")}>
        {children}
      </div>
    </div>
  );
}
