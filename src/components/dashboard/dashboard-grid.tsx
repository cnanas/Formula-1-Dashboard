"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Responsive, verticalCompactor, type Layout, type ResponsiveLayouts } from "react-grid-layout";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WidgetWrapper } from "./widget-wrapper";
import { CountdownWidget } from "./widgets/countdown-widget";
import { StandingsWidget } from "./widgets/standings-widget";
import { ConstructorStandingsWidget } from "./widgets/constructor-standings-widget";
import { LiveStatusWidget } from "./widgets/live-status-widget";
import { NewsWidget } from "./widgets/news-widget";
import { CalendarWidget } from "./widgets/calendar-widget";
import { QuickLinksWidget } from "./widgets/quick-links-widget";
import { CircuitInfoWidget } from "./widgets/circuit-info-widget";
import { TeamPerformanceWidget } from "./widgets/team-performance-widget";
import { SessionScheduleWidget } from "./widgets/session-schedule-widget";
import { DriverH2HWidget } from "./widgets/driver-h2h-widget";
import { PointsPerRaceWidget } from "./widgets/points-per-race-widget";
import { FastestPitstopWidget } from "./widgets/fastest-pitstop-widget";
import { CrashDamageWidget } from "./widgets/crash-damage-widget";
import { UsedElementsWidget } from "./widgets/used-elements-widget";
import { TechUpgradesWidget } from "./widgets/tech-upgrades-widget";
import { SocialBannerWidget } from "./widgets/social-banner-widget";
import { NewLiveriesWidget } from "./widgets/new-liveries-widget";
import { DriverProfileWidget } from "./widgets/driver-profile-widget";
import { TeamProfileWidget } from "./widgets/team-profile-widget";
import { useDashboardEdit } from "@/providers/dashboard-edit-provider";

import "react-grid-layout/css/styles.css";

// Widget registry
const WIDGET_REGISTRY: Record<
  string,
  { title: string; subtitle?: string; component: React.ComponentType; defaultSize: { w: number; h: number }; noHeader?: boolean; className?: string }
> = {
  "circuit-info": {
    title: "Schedule",
    subtitle: "Current Circuit",
    component: CircuitInfoWidget,
    defaultSize: { w: 6, h: 6 },
  },
  standings: {
    title: "Standings",
    component: StandingsWidget,
    defaultSize: { w: 4, h: 7 },
  },
  "constructor-standings": {
    title: "Constructors",
    component: ConstructorStandingsWidget,
    defaultSize: { w: 4, h: 7 },
  },
  countdown: {
    title: "Next Race",
    component: CountdownWidget,
    defaultSize: { w: 4, h: 3 },
    noHeader: true,
    className: "bg-transparent border-0 shadow-none",
  },
  "live-status": {
    title: "Live Session",
    component: LiveStatusWidget,
    defaultSize: { w: 4, h: 4 },
  },
  news: {
    title: "Latest News",
    component: NewsWidget,
    defaultSize: { w: 4, h: 5 },
  },
  calendar: {
    title: "Upcoming Races",
    subtitle: "Race Calendar",
    component: CalendarWidget,
    defaultSize: { w: 4, h: 4 },
  },
  "quick-links": {
    title: "Quick Links",
    component: QuickLinksWidget,
    defaultSize: { w: 4, h: 4 },
  },
  "team-performance": {
    title: "Team Performance",
    subtitle: "Season Statistics",
    component: TeamPerformanceWidget,
    defaultSize: { w: 6, h: 6 },
  },
  "session-schedule": {
    title: "Race Weekend",
    subtitle: "Session Schedule",
    component: SessionScheduleWidget,
    defaultSize: { w: 4, h: 5 },
  },
  "driver-h2h": {
    title: "Driver Comparison",
    subtitle: "Head-to-Head",
    component: DriverH2HWidget,
    defaultSize: { w: 6, h: 6 },
  },
  "points-per-race": {
    title: "Points per Race",
    subtitle: "Season History",
    component: PointsPerRaceWidget,
    defaultSize: { w: 6, h: 6 },
  },
  "fastest-pitstop": {
    title: "Fastest Pit Stop",
    component: FastestPitstopWidget,
    defaultSize: { w: 4, h: 3 },
  },
  "crash-damage": {
    title: "Crash Damage",
    component: CrashDamageWidget,
    defaultSize: { w: 4, h: 3 },
  },
  "used-elements": {
    title: "Used Elements",
    component: UsedElementsWidget,
    defaultSize: { w: 4, h: 3 },
  },
  "tech-upgrades": {
    title: "Tech Upgrades",
    component: TechUpgradesWidget,
    defaultSize: { w: 4, h: 3 },
  },
  "social-banner": {
    title: "Stay Connected",
    component: SocialBannerWidget,
    defaultSize: { w: 8, h: 3 },
    noHeader: true,
    className: "bg-transparent border-0 shadow-none",
  },
  "new-liveries": {
    title: "New Liveries",
    component: NewLiveriesWidget,
    defaultSize: { w: 4, h: 3 },
    noHeader: true,
    className: "bg-transparent border-0 shadow-none",
  },
  "driver-profile": {
    title: "Driver Profile",
    subtitle: "Favorite Driver",
    component: DriverProfileWidget,
    defaultSize: { w: 4, h: 6 },
  },
  "team-profile": {
    title: "Team Profile",
    subtitle: "Favorite Team",
    component: TeamProfileWidget,
    defaultSize: { w: 4, h: 6 },
  },
};

const STORAGE_KEY = "f1dash_widget_layouts_v4";
const WIDGETS_KEY = "f1dash_active_widgets_v4";

// Default widgets for first-time users - clean, useful layout
const DEFAULT_WIDGETS = [
  "standings",
  "constructor-standings",
  "driver-h2h",
  "circuit-info",
  "news",
  "driver-profile",
  "team-profile",
  "team-performance",
];

// Default layout matching the user's preferred arrangement:
// Left column: Standings, Constructors, Driver Comparison
// Middle column: Circuit Info/Schedule, Latest News
// Right column: Driver Profile, Team Profile, Team Performance
const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    // Left column (x: 0, w: 4)
    { i: "standings", x: 0, y: 0, w: 4, h: 7, minW: 3, minH: 5 },
    { i: "constructor-standings", x: 0, y: 7, w: 4, h: 7, minW: 3, minH: 5 },
    { i: "driver-h2h", x: 0, y: 14, w: 4, h: 6, minW: 3, minH: 5 },
    // Middle column (x: 4, w: 4)
    { i: "circuit-info", x: 4, y: 0, w: 4, h: 6, minW: 4, minH: 5 },
    { i: "news", x: 4, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
    // Right column (x: 8, w: 4)
    { i: "driver-profile", x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 5 },
    { i: "team-profile", x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 5 },
    { i: "team-performance", x: 8, y: 12, w: 4, h: 6, minW: 3, minH: 5 },
  ],
  md: [
    // Two columns on medium screens
    { i: "standings", x: 0, y: 0, w: 5, h: 7, minW: 3, minH: 5 },
    { i: "constructor-standings", x: 5, y: 0, w: 5, h: 7, minW: 3, minH: 5 },
    { i: "driver-h2h", x: 0, y: 7, w: 5, h: 6, minW: 3, minH: 5 },
    { i: "circuit-info", x: 5, y: 7, w: 5, h: 6, minW: 4, minH: 5 },
    { i: "news", x: 0, y: 13, w: 5, h: 6, minW: 3, minH: 4 },
    { i: "driver-profile", x: 5, y: 13, w: 5, h: 6, minW: 3, minH: 5 },
    { i: "team-profile", x: 0, y: 19, w: 5, h: 6, minW: 3, minH: 5 },
    { i: "team-performance", x: 5, y: 19, w: 5, h: 6, minW: 3, minH: 5 },
  ],
  sm: [
    // Single column on small screens
    { i: "standings", x: 0, y: 0, w: 6, h: 7, minW: 3, minH: 5 },
    { i: "constructor-standings", x: 0, y: 7, w: 6, h: 7, minW: 3, minH: 5 },
    { i: "circuit-info", x: 0, y: 14, w: 6, h: 6, minW: 4, minH: 5 },
    { i: "news", x: 0, y: 20, w: 6, h: 6, minW: 3, minH: 4 },
    { i: "driver-h2h", x: 0, y: 26, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "driver-profile", x: 0, y: 32, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "team-profile", x: 0, y: 38, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "team-performance", x: 0, y: 44, w: 6, h: 6, minW: 3, minH: 5 },
  ],
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full
  }
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(ref.current);
    setWidth(ref.current.offsetWidth);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export function DashboardGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const [mounted, setMounted] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS);
  
  // Use the dashboard edit context
  const { isEditing, setShowEditButton } = useDashboardEdit();

  // Register this component with the context to show the edit button
  useEffect(() => {
    setShowEditButton(true);
    return () => setShowEditButton(false);
  }, [setShowEditButton]);

  useEffect(() => {
    setActiveWidgets(loadFromStorage(WIDGETS_KEY, DEFAULT_WIDGETS));
    setLayouts(loadFromStorage(STORAGE_KEY, DEFAULT_LAYOUTS));
    setMounted(true);
  }, []);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
      setLayouts(allLayouts);
      saveToStorage(STORAGE_KEY, allLayouts);
    },
    []
  );

  const addWidget = useCallback(
    (widgetId: string) => {
      if (activeWidgets.includes(widgetId)) return;

      const widget = WIDGET_REGISTRY[widgetId];
      if (!widget) return;

      const newWidgets = [...activeWidgets, widgetId];
      setActiveWidgets(newWidgets);
      saveToStorage(WIDGETS_KEY, newWidgets);

      const newLayouts = { ...layouts };
      const breakpoints = ["lg", "md", "sm"] as const;
      const cols = { lg: 12, md: 10, sm: 6 };

      for (const bp of breakpoints) {
        const existing = newLayouts[bp] ?? [];
        const maxY = existing.reduce((max, item) => Math.max(max, item.y + item.h), 0);
        newLayouts[bp] = [
          ...existing,
          {
            i: widgetId,
            x: 0,
            y: maxY,
            w: Math.min(widget.defaultSize.w, cols[bp]),
            h: widget.defaultSize.h,
            minW: 3,
            minH: 2,
          },
        ];
      }

      setLayouts(newLayouts);
      saveToStorage(STORAGE_KEY, newLayouts);
    },
    [activeWidgets, layouts]
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      const newWidgets = activeWidgets.filter((id) => id !== widgetId);
      setActiveWidgets(newWidgets);
      saveToStorage(WIDGETS_KEY, newWidgets);

      const newLayouts: ResponsiveLayouts = {};
      for (const [bp, items] of Object.entries(layouts)) {
        newLayouts[bp] = (items ?? []).filter((item) => item.i !== widgetId);
      }
      setLayouts(newLayouts);
      saveToStorage(STORAGE_KEY, newLayouts);
    },
    [activeWidgets, layouts]
  );

  const resetLayout = useCallback(() => {
    setActiveWidgets(DEFAULT_WIDGETS);
    setLayouts(DEFAULT_LAYOUTS);
    saveToStorage(WIDGETS_KEY, DEFAULT_WIDGETS);
    saveToStorage(STORAGE_KEY, DEFAULT_LAYOUTS);
  }, []);

  const availableWidgets = Object.entries(WIDGET_REGISTRY).filter(
    ([id]) => !activeWidgets.includes(id)
  );

  return (
    <div ref={containerRef}>
      {/* Edit mode toolbar - only shown when editing */}
      {isEditing && (
        <div className="flex items-center gap-2 mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={availableWidgets.length === 0}>
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableWidgets.map(([id, widget]) => (
                <DropdownMenuItem key={id} onClick={() => addWidget(id)}>
                  {widget.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={resetLayout}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      )}

      {/* Grid */}
      {mounted && (
        <Responsive
          className="dashboard-grid"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={60}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          dragConfig={{ enabled: isEditing, handle: ".drag-handle" }}
          resizeConfig={{ enabled: isEditing }}
          compactor={verticalCompactor}
          margin={[16, 16]}
        >
          {activeWidgets.map((widgetId) => {
            const widget = WIDGET_REGISTRY[widgetId];
            if (!widget) return null;
            const WidgetComponent = widget.component;

            return (
              <div key={widgetId}>
                <WidgetWrapper
                  title={widget.title}
                  subtitle={widget.subtitle}
                  isEditing={isEditing}
                  onRemove={() => removeWidget(widgetId)}
                  noHeader={widget.noHeader}
                  className={widget.className}
                  noPadding={widget.noHeader}
                >
                  <WidgetComponent />
                </WidgetWrapper>
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}
