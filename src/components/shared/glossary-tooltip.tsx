"use client";

import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGlossaryTermById } from "@/lib/constants/glossary";
import { cn } from "@/lib/utils";

interface GlossaryTooltipProps {
  termId: string;
  label?: string;
  className?: string;
}

export function GlossaryTooltip({
  termId,
  label,
  className,
}: GlossaryTooltipProps) {
  const term = getGlossaryTermById(termId);
  if (!term) return <>{label ?? termId}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-sm border-b border-dashed border-border/80 font-medium text-foreground transition-colors hover:text-primary",
            className
          )}
        >
          {label ?? term.term}
          <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3" sideOffset={8}>
        <p className="text-xs font-semibold">{term.term}</p>
        <p className="mt-1 text-xs text-muted-foreground">{term.definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
