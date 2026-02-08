"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontal,
  X,
  ChevronUp,
  Check,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";
import {
  DEFAULT_NAV_ORDER,
  loadNavOrder,
  saveNavOrder,
  getOrderedNavItems,
  type NavItem,
} from "@/lib/constants/nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navOrder, setNavOrder] = useState(DEFAULT_NAV_ORDER);
  const { theme } = useCircuitTheme();

  useEffect(() => {
    setMounted(true);
    setNavOrder(loadNavOrder());
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  if (!mounted) return null;

  const orderedItems = getOrderedNavItems(navOrder);
  const primaryItems = orderedItems.slice(0, 4);
  const secondaryItems = orderedItems.slice(4);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:hidden"
          >
            <div
              className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl p-4 shadow-2xl"
              style={{
                boxShadow: `0 -10px 50px -10px ${theme.primaryColor}50, 0 0 0 1px ${theme.primaryColor}20`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  More
                </span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <motion.div
          layout
          className="flex items-center gap-1 px-2 py-2 rounded-full border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl"
          style={{
            boxShadow: `0 10px 50px -10px ${theme.primaryColor}50, 0 0 0 1px ${theme.primaryColor}25, 0 4px 20px -5px rgba(0,0,0,0.3)`,
          }}
        >
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="relative">
                <motion.div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {active && (
                    <motion.div
                      layoutId="pill-indicator"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: theme.primaryColor }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    />
                  )}
                  <Icon className={cn("h-5 w-5 relative z-10", active && "text-white")} />
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium relative z-10 text-white"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative"
          >
            <motion.div
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors",
                isExpanded
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded && (
                <motion.div
                  layoutId="pill-indicator-more"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: theme.primaryColor }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 relative z-10 text-white" />
              ) : (
                <MoreHorizontal className="h-5 w-5 relative z-10" />
              )}
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium relative z-10 text-white"
                >
                  More
                </motion.span>
              )}
            </motion.div>
          </button>
        </motion.div>
      </nav>
    </>
  );
}

function SortableNavItem({
  item,
  isActive,
  theme,
  isReorderMode,
}: {
  item: NavItem;
  isActive: boolean;
  theme: { primaryColor: string };
  isReorderMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center",
        isDragging && "opacity-50 z-50"
      )}
    >
      {isReorderMode ? (
        <div className="flex items-center gap-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-muted/80 touch-none self-center"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Link href={item.href} className="relative" onClick={(e) => e.stopPropagation()}>
            <motion.div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-colors relative",
                isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="desktop-pill-indicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: theme.primaryColor }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className="h-5 w-5 relative z-10" />
            </motion.div>
          </Link>
        </div>
      ) : (
        <Link href={item.href} className="relative group">
          <motion.div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-colors relative",
              isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="desktop-pill-indicator"
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: theme.primaryColor }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
            <Icon className="h-5 w-5 relative z-10" />
          </motion.div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
            {item.label}
          </div>
        </Link>
      )}
    </div>
  );
}

const LONG_PRESS_MS = 1000;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export function DesktopBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [navOrder, setNavOrder] = useState(DEFAULT_NAV_ORDER);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme } = useCircuitTheme();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    setMounted(true);
    setNavOrder(loadNavOrder());
  }, []);

  const orderedItems = getOrderedNavItems(navOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setNavOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        saveNavOrder(next);
        return next;
      });
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      setIsReorderMode(true);
    }, LONG_PRESS_MS);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  if (!mounted || !isDesktop) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handlePointerLeave();
      }}
    >
      <motion.div
        layout
        className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl"
        style={{
          boxShadow: `0 10px 55px -10px ${theme.primaryColor}55, 0 0 0 1px ${theme.primaryColor}25, 0 4px 25px -5px rgba(0,0,0,0.4)`,
        }}
        animate={{ scale: isHovered ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={navOrder}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="flex items-center gap-1"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerLeave}
            >
              {orderedItems.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  {index === 4 && (
                    <div className="w-px h-6 bg-border mx-1 shrink-0" />
                  )}
                  <SortableNavItem
                    item={item}
                    isActive={isActive(item.href)}
                    theme={theme}
                    isReorderMode={isReorderMode}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {isReorderMode && (
          <button
            onClick={() => setIsReorderMode(false)}
            className="flex items-center gap-1.5 ml-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        )}
      </motion.div>
      {isReorderMode && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Drag to reorder • Tap Done when finished
        </p>
      )}
    </nav>
  );
}
