"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigationMode } from "@/providers/navigation-mode-provider";
import { CHANGELOG_ENTRIES } from "@/lib/constants/changelog";
import { cn } from "@/lib/utils";

export function ChangelogModal() {
  const [open, setOpen] = useState(false);
  const { mode } = useNavigationMode();

  return (
    <>
      <div
        className={cn(
          "fixed left-3 z-40 md:left-5",
          mode === "bottom" ? "bottom-24 md:bottom-5" : "bottom-5"
        )}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full border-border/70 bg-background/95 shadow-lg backdrop-blur-md"
          onClick={() => setOpen(true)}
        >
          <Megaphone className="h-4 w-4" />
          What&apos;s New
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-[min(100%,760px)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Changelog</DialogTitle>
            <DialogDescription>
              Recent updates shipped to the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto pr-1">
            {CHANGELOG_ENTRIES.map((entry) => (
              <section
                key={entry.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {entry.title}
                  </h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {entry.dateLabel}
                  </Badge>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {entry.updates.map((update) => (
                    <li key={update}>{update}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
