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

      {/* Content */}
      <div className={cn("flex-1 overflow-auto", !noPadding && "px-5 pb-5")}>
        {children}
      </div>
    </div>
  );
}
