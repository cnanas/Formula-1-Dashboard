"use client";

import Image from "next/image";
import { CircuitSectorMap } from "@/components/shared/circuit-sector-map";
import { getTeamLogoUrl } from "@/lib/constants/team-logos";
import { formatLapTime } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils";

interface SessionSocialCardsProps {
  eventTitle: string;
  sessionTitle: string;
  circuitShortName: string;
  classificationRows: {
    position: number;
    driverNumber: number;
    driverName: string;
    teamName: string;
    bestLap: number | null;
    gapToFastest: number | null;
    laps: number;
  }[];
  sectorWinners: {
    sector: 1 | 2 | 3;
    driverNumber: number;
    driverName: string;
    teamName: string;
    sectorTime: number;
  }[];
  speedTrapRows: {
    position: number;
    driverNumber: number;
    driverName: string;
    teamName: string;
    speed: number;
  }[];
  compact?: boolean;
  maxClassificationRows?: number;
  className?: string;
  view?: "all" | "classification" | "sectors" | "speed";
  minimalHeader?: boolean;
  density?: "tight" | "compact" | "roomy";
  classificationBodyMaxHeight?: number;
}

function TeamMark({ teamName, density }: { teamName: string; density: "tight" | "compact" | "roomy" }) {
  const logo = getTeamLogoUrl(teamName);
  const markSizeClass = density === "tight" ? "h-4 w-4" : "h-5 w-5";
  const fallbackSizeClass =
    density === "tight"
      ? "h-4 w-4 text-[9px]"
      : "h-5 w-5 text-[10px]";

  if (!logo) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 dark:bg-white/10 dark:text-white/70",
          fallbackSizeClass
        )}
        aria-hidden
      >
        {teamName.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={logo}
      alt={teamName}
      width={20}
      height={20}
      className={cn("object-contain", markSizeClass)}
    />
  );
}

function cardClasses(extra?: string) {
  return cn(
    "relative overflow-hidden rounded-2xl border border-slate-200/80 text-slate-900 shadow-[0_20px_48px_rgba(15,23,42,0.14)] dark:border-white/10 dark:text-slate-100 dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]",
    extra
  );
}

function cardBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,#fbfdff_0%,#f4f8ff_52%,#fff3e8_100%)] dark:bg-[linear-gradient(145deg,#101931_0%,#0b1124_48%,#1a1432_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(30,64,175,0.18)_1px,transparent_1px)] [background-size:17px_17px] dark:opacity-25 dark:[background-image:radial-gradient(circle,rgba(239,68,68,0.55)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(124deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.04)_13%,transparent_13%,transparent_30%,rgba(15,23,42,0.03)_30%,rgba(15,23,42,0.03)_46%,transparent_46%,transparent_63%,rgba(15,23,42,0.03)_63%,rgba(15,23,42,0.03)_78%,transparent_78%)] dark:bg-[linear-gradient(124deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.03)_14%,transparent_14%,transparent_30%,rgba(255,255,255,0.02)_30%,rgba(255,255,255,0.02)_44%,transparent_44%,transparent_58%,rgba(255,255,255,0.02)_58%,rgba(255,255,255,0.02)_72%,transparent_72%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-red-500 via-sky-500 to-lime-400" />
    </>
  );
}

function SectionTable({
  children,
  compact,
  tight,
  className,
}: {
  children: React.ReactNode;
  compact?: boolean;
  tight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-xl border border-slate-300/70 bg-white/70 backdrop-blur-sm dark:border-white/15 dark:bg-white/5",
        compact && "mt-3",
        tight && "mt-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SessionSocialCards({
  eventTitle,
  sessionTitle,
  circuitShortName,
  classificationRows,
  sectorWinners,
  speedTrapRows,
  compact = false,
  maxClassificationRows,
  className,
  view = "all",
  minimalHeader = false,
  density = "compact",
  classificationBodyMaxHeight,
}: SessionSocialCardsProps) {
  const displayClassification = classificationRows.slice(0, maxClassificationRows ?? (compact ? 12 : 22));
  const displaySpeedTrap = speedTrapRows.slice(0, 10);
  const isTight = density === "tight";
  const isRoomy = density === "roomy";
  const contentPaddingClass = isTight ? "p-2.5" : isRoomy ? "p-4" : "p-3.5";
  const headerTextClass = isTight ? "text-[9px]" : "text-[10px]";
  const titleClass = isTight
    ? "text-base"
    : compact
    ? "text-lg"
    : "text-[2rem] leading-[1.02]";
  const sectionTableMarginClass = isTight ? "mt-2" : "mt-3";
  const sectionRowPaddingClass = isTight ? "py-1.5" : "py-2";
  const bodyTextClass = isTight ? "text-[13px]" : "text-sm";
  const compactClassificationMaxHeight = isTight ? 208 : isRoomy ? 320 : 260;
  const computedClassificationMaxHeight = classificationBodyMaxHeight ?? (
    compact ? compactClassificationMaxHeight : 420
  );

  const showClassification = view === "all" || view === "classification";
  const showSectors = view === "all" || view === "sectors";
  const showSpeed = view === "all" || view === "speed";
  const visibleCardCount = Number(showClassification) + Number(showSectors) + Number(showSpeed);

  const rootClasses =
    visibleCardCount === 1
      ? "grid gap-4"
      : compact
      ? "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
      : "grid gap-4 xl:grid-cols-3";

  const panelClasses =
    visibleCardCount === 1
      ? "h-full"
      : compact
      ? "min-w-[320px] snap-start"
      : "xl:col-span-1";

  return (
    <div className={cn(rootClasses, className)}>
      {showClassification && (
      <section className={cardClasses(panelClasses)}>
        {cardBackground()}
        <div className={cn("relative z-10 h-full min-h-0 flex flex-col", compact ? contentPaddingClass : "p-4", compact && minimalHeader && "p-2.5")}>
          {!minimalHeader && (
            <>
              <p className={cn("uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300/80", headerTextClass)}>
                Telemetry Snapshot
              </p>
              <h3 className={cn("mt-1 font-black uppercase tracking-[0.03em]", titleClass)}>
                {eventTitle}
              </h3>
              <p className={cn("font-semibold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200/85", isTight ? "text-xs" : "text-sm")}>
                {sessionTitle} Classification
              </p>
            </>
          )}

          <SectionTable compact={compact} tight={minimalHeader} className="flex-1 min-h-0 flex flex-col">
            <div className={cn(
              "grid grid-cols-[40px_1fr_56px_72px] gap-2 border-b border-slate-300/60 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:border-white/10 dark:text-slate-300/80",
              sectionRowPaddingClass
            )}>
              <span>Pos</span>
              <span>Driver</span>
              <span className="text-right">Laps</span>
              <span className="text-right">Gap</span>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto"
              style={classificationBodyMaxHeight ? { maxHeight: computedClassificationMaxHeight } : undefined}
            >
              {displayClassification.map((row, idx) => (
                <div
                  key={`${row.driverNumber}-${idx}`}
                  className={cn(
                    "grid grid-cols-[40px_1fr_56px_72px] items-center gap-2 border-b border-slate-200/70 px-3 last:border-b-0 dark:border-white/8",
                    sectionRowPaddingClass,
                    bodyTextClass
                  )}
                >
                  <span className="font-black tabular-nums text-slate-900 dark:text-slate-100">{row.position}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <TeamMark teamName={row.teamName} density={density} />
                    <span className="truncate font-semibold uppercase text-slate-800 dark:text-slate-100/90">{row.driverName}</span>
                  </span>
                  <span className="text-right font-mono text-xs text-slate-600 dark:text-slate-300/70">{row.laps}</span>
                  <span className="text-right font-mono text-xs text-slate-800 dark:text-slate-100">
                    {row.position === 1
                      ? formatLapTime(row.bestLap)
                      : row.gapToFastest == null
                      ? "-"
                      : `+${row.gapToFastest.toFixed(3)}`}
                  </span>
                </div>
              ))}
            </div>
          </SectionTable>
        </div>
      </section>
      )}

      {showSectors && (
      <section className={cardClasses(panelClasses)}>
        {cardBackground()}
        <div className={cn("relative z-10 p-4", compact && contentPaddingClass, compact && minimalHeader && "p-2.5")}>
          {!minimalHeader && (
            <>
              <p className={cn("uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300/80", headerTextClass)}>
                Telemetry Snapshot
              </p>
              <h3 className={cn("mt-1 font-black uppercase tracking-[0.03em]", titleClass)}>
                {eventTitle}
              </h3>
              <p className={cn("font-semibold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200/85", isTight ? "text-xs" : "text-sm")}>
                {sessionTitle} Fastest Sectors
              </p>
            </>
          )}

          <div className={cn(
            "rounded-xl border border-slate-300/70 bg-white/70 px-3 backdrop-blur-sm dark:border-white/15 dark:bg-white/5",
            sectionTableMarginClass,
            isTight ? "py-2.5" : "py-4",
            minimalHeader && "mt-2 py-2.5"
          )}>
            <div className={cn("mx-auto", isTight ? "max-w-[110px]" : compact ? "max-w-[140px]" : "max-w-[170px]", minimalHeader && "max-w-[118px]")}>
              <CircuitSectorMap circuitShortName={circuitShortName} className="w-full" />
            </div>
            <div className={cn(
              "mt-2 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200/80",
              isTight ? "gap-2 text-[10px]" : "gap-4"
            )}>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded bg-red-500" />Sec 1</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded bg-cyan-400" />Sec 2</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded bg-lime-400" />Sec 3</span>
            </div>
          </div>

          <SectionTable compact={compact} tight={minimalHeader}>
            <div className={cn(
              "grid grid-cols-[64px_1fr_72px] gap-2 border-b border-slate-300/60 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:border-white/10 dark:text-slate-300/80",
              sectionRowPaddingClass
            )}>
              <span>Sector</span>
              <span>Driver</span>
              <span className="text-right">Time</span>
            </div>
            {sectorWinners.map((row) => (
              <div
                key={row.sector}
                className={cn(
                  "grid grid-cols-[64px_1fr_72px] items-center gap-2 border-b border-slate-200/70 px-3 last:border-b-0 dark:border-white/8",
                  sectionRowPaddingClass,
                  bodyTextClass
                )}
              >
                <span className="font-black text-slate-900 dark:text-slate-100">SEC {row.sector}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <TeamMark teamName={row.teamName} density={density} />
                  <span className="truncate font-semibold uppercase text-slate-800 dark:text-slate-100/90">{row.driverName}</span>
                </span>
                <span className="text-right font-mono text-xs text-slate-800 dark:text-slate-100">{row.sectorTime.toFixed(3)}</span>
              </div>
            ))}
          </SectionTable>
        </div>
      </section>
      )}

      {showSpeed && (
      <section className={cardClasses(panelClasses)}>
        {cardBackground()}
        <div className={cn("relative z-10 p-4", compact && contentPaddingClass, compact && minimalHeader && "p-2.5")}>
          {!minimalHeader && (
            <>
              <p className={cn("uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300/80", headerTextClass)}>
                Telemetry Snapshot
              </p>
              <h3 className={cn("mt-1 font-black uppercase tracking-[0.03em]", titleClass)}>
                {eventTitle}
              </h3>
              <p className={cn("font-semibold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200/85", isTight ? "text-xs" : "text-sm")}>
                {sessionTitle} Speed Trap Top 10
              </p>
            </>
          )}

          <SectionTable compact={compact} tight={minimalHeader}>
            <div className={cn(
              "grid grid-cols-[40px_1fr_72px] gap-2 border-b border-slate-300/60 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:border-white/10 dark:text-slate-300/80",
              sectionRowPaddingClass
            )}>
              <span>Pos</span>
              <span>Driver</span>
              <span className="text-right">km/h</span>
            </div>
            {displaySpeedTrap.map((row) => (
              <div
                key={`${row.driverNumber}-${row.position}`}
                className={cn(
                  "grid grid-cols-[40px_1fr_72px] items-center gap-2 border-b border-slate-200/70 px-3 last:border-b-0 dark:border-white/8",
                  sectionRowPaddingClass,
                  bodyTextClass
                )}
              >
                <span className="font-black tabular-nums text-slate-900 dark:text-slate-100">{row.position}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <TeamMark teamName={row.teamName} density={density} />
                  <span className="truncate font-semibold uppercase text-slate-800 dark:text-slate-100/90">{row.driverName}</span>
                </span>
                <span className="text-right font-mono text-xs text-slate-800 dark:text-slate-100">{row.speed.toFixed(1)}</span>
              </div>
            ))}
          </SectionTable>
        </div>
      </section>
      )}
    </div>
  );
}
