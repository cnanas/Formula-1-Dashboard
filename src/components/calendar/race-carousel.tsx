"use client";

import { useRef, useEffect, useCallback } from "react";
import { format, isPast } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getTrackLayout } from "@/lib/constants/track-layouts";
import type { Meeting } from "@/types/openf1";

interface RaceCarouselProps {
  meetings: Meeting[];
  selectedMeetingKey: number | null;
  onSelectMeeting: (meetingKey: number) => void;
  sprintMeetingKeys: Set<number>;
}

export function RaceCarousel({
  meetings,
  selectedMeetingKey,
  onSelectMeeting,
  sprintMeetingKeys,
}: RaceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll selected card into view
  useEffect(() => {
    if (!selectedMeetingKey) return;
    const card = cardRefs.current.get(selectedMeetingKey);
    card?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedMeetingKey]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const now = new Date();

  return (
    <div className="absolute bottom-4 left-0 right-0 z-10 px-2 sm:px-4">
      <div className="relative flex items-center gap-2">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/80 dark:bg-white/10 backdrop-blur-md border border-border/40 shadow-lg hover:bg-background dark:hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrollable card strip */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {meetings.map((meeting, index) => {
            const isSelected = meeting.meeting_key === selectedMeetingKey;
            const startDate = new Date(meeting.date_start);
            const endDate = new Date(meeting.date_end);
            const completed = isPast(endDate);
            const isLive = startDate <= now && endDate >= now;
            const isSprint = sprintMeetingKeys.has(meeting.meeting_key);
            const trackLayout = getTrackLayout(meeting.circuit_short_name);

            return (
              <div
                key={meeting.meeting_key}
                ref={(el) => {
                  if (el) cardRefs.current.set(meeting.meeting_key, el);
                }}
                className={`
                  flex-shrink-0 w-[240px] sm:w-[280px] snap-center cursor-pointer rounded-xl
                  border p-4 transition-all duration-200
                  backdrop-blur-md
                  ${
                    isSelected
                      ? "border-foreground/40 bg-background/90 dark:bg-white/15 shadow-xl"
                      : "border-border/30 bg-background/70 dark:bg-white/5 hover:bg-background/80 dark:hover:bg-white/10"
                  }
                `}
                onClick={() => onSelectMeeting(meeting.meeting_key)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Round + badges row */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground">
                        R{index + 1}
                      </span>
                      {isSprint && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/80 text-white uppercase">
                          Sprint
                        </span>
                      )}
                      {isLive ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500 text-white uppercase">
                          Live
                        </span>
                      ) : completed ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Country flag + name */}
                    <div className="flex items-center gap-2 mb-1">
                      <Image
                        src={`https://flagcdn.com/24x18/${meeting.country_code.toLowerCase()}.png`}
                        alt={meeting.country_name}
                        width={24}
                        height={18}
                        className="rounded-[2px] shadow-sm"
                        unoptimized
                      />
                      <span className="text-base font-bold truncate">
                        {meeting.country_name}
                      </span>
                    </div>

                    {/* Date range */}
                    <p className="text-xs text-muted-foreground">
                      {format(startDate, "dd")} - {format(endDate, "dd MMM")}.
                    </p>
                  </div>

                  {/* Track layout SVG */}
                  {trackLayout && (
                    <div className="w-16 h-12 flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={trackLayout.svgPath}
                        alt=""
                        width={64}
                        height={48}
                        className="w-full h-full object-contain brightness-0 opacity-40 dark:brightness-200 dark:invert dark:opacity-60"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/80 dark:bg-white/10 backdrop-blur-md border border-border/40 shadow-lg hover:bg-background dark:hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
