"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Responsive, verticalCompactor, type Layout, type ResponsiveLayouts } from "react-grid-layout";
import { Pencil, Plus, RotateCcw, Check } from "lucide-react";
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

import "react-grid-layout/css/styles.css";

// Widget registry
const WIDGET_REGISTRY: Record<
  string,
  { title: string; component: React.ComponentType; defaultSize: { w: number; h: number } }
> = {
  countdown: {
    title: "Next Race",
    component: CountdownWidget,
    defaultSize: { w: 4, h: 3 },
  },
  "live-status": {
    title: "Live Session",
    component: LiveStatusWidget,
    defaultSize: { w: 4, h: 4 },
  },
  standings: {
    title: "Driver Standings",
    component: StandingsWidget,
    defaultSize: { w: 4, h: 5 },
  },
  "constructor-standings": {
    title: "Constructor Standings",
    component: ConstructorStandingsWidget,
    defaultSize: { w: 4, h: 5 },
  },
  news: {
    title: "Latest News",
    component: NewsWidget,
    defaultSize: { w: 4, h: 5 },
  },
  calendar: {
    title: "Upcoming Races",
    component: CalendarWidget,
    defaultSize: { w: 4, h: 4 },
  },
  "quick-links": {
    title: "Quick Links",
    component: QuickLinksWidget,
    defaultSize: { w: 4, h: 3 },
  },
};

const STORAGE_KEY = "f1dash_widget_layouts";
const WIDGETS_KEY = "f1dash_active_widgets";

const DEFAULT_WIDGETS = [
  "countdown",
  "live-status",
  "quick-links",
  "standings",
  "constructor-standings",
  "news",
  "calendar",
];

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "countdown", x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "live-status", x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "quick-links", x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "standings", x: 0, y: 3, w: 4, h: 5, minW: 3, minH: 3 },
    { i: "constructor-standings", x: 4, y: 4, w: 4, h: 5, minW: 3, minH: 3 },
    { i: "news", x: 8, y: 3, w: 4, h: 5, minW: 3, minH: 3 },
    { i: "calendar", x: 0, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
  ],
  md: [
    { i: "countdown", x: 0, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
    { i: "live-status", x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: "quick-links", x: 0, y: 3, w: 5, h: 3, minW: 3, minH: 2 },
    { i: "standings", x: 5, y: 4, w: 5, h: 5, minW: 3, minH: 3 },
    { i: "constructor-standings", x: 0, y: 6, w: 5, h: 5, minW: 3, minH: 3 },
    { i: "news", x: 5, y: 9, w: 5, h: 5, minW: 3, minH: 3 },
    { i: "calendar", x: 0, y: 11, w: 5, h: 4, minW: 3, minH: 3 },
  ],
  sm: [
    { i: "countdown", x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
    { i: "live-status", x: 0, y: 3, w: 6, h: 4, minW: 3, minH: 3 },
    { i: "quick-links", x: 0, y: 7, w: 6, h: 3, minW: 3, minH: 2 },
    { i: "standings", x: 0, y: 10, w: 6, h: 5, minW: 3, minH: 3 },
    { i: "constructor-standings", x: 0, y: 15, w: 6, h: 5, minW: 3, minH: 3 },
    { i: "news", x: 0, y: 20, w: 6, h: 5, minW: 3, minH: 3 },
    { i: "calendar", x: 0, y: 25, w: 6, h: 4, minW: 3, minH: 3 },
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
  const [isEditing, setIsEditing] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS);

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
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Done
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-1" />
              Edit Dashboard
            </>
          )}
        </Button>

        {isEditing && (
          <>
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
          </>
        )}
      </div>

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
                  isEditing={isEditing}
                  onRemove={() => removeWidget(widgetId)}
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
