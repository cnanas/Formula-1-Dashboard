"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Radio,
  Calendar,
  Trophy,
  Newspaper,
  BarChart3,
  GitCompareArrows,
  CircleDot,
  Gauge,
  Zap,
  CloudSun,
  MapPin,
  MoreHorizontal,
  X,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";

// Primary nav items (always visible in pill)
const PRIMARY_NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Live", href: "/live", icon: Radio },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Standings", href: "/standings", icon: Trophy },
];

// Secondary nav items (in expandable menu)
const SECONDARY_NAV = [
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Track History", href: "/tracks", icon: MapPin },
  { label: "Compare", href: "/compare", icon: GitCompareArrows },
  { label: "Pit Stops", href: "/pitstops", icon: CircleDot },
  { label: "Overtakes", href: "/overtakes", icon: Zap },
  { label: "Speed Traps", href: "/speed-traps", icon: Gauge },
  { label: "Weather", href: "/weather", icon: CloudSun },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useCircuitTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  if (!mounted) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop when expanded */}
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

      {/* Expanded menu */}
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
                {SECONDARY_NAV.map((item) => {
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

      {/* Main pill navigation */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <motion.div
          layout
          className="flex items-center gap-1 px-2 py-2 rounded-full border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl"
          style={{
            boxShadow: `0 10px 50px -10px ${theme.primaryColor}50, 0 0 0 1px ${theme.primaryColor}25, 0 4px 20px -5px rgba(0,0,0,0.3)`,
          }}
        >
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative"
              >
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

          {/* More button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-full transition-all",
              isExpanded
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <MoreHorizontal className="h-5 w-5" />
              )}
            </motion.div>
          </button>
        </motion.div>
      </nav>
    </>
  );
}

// Desktop version - floating dock at bottom
export function DesktopBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useCircuitTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const allNav = [...PRIMARY_NAV, ...SECONDARY_NAV];

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        layout
        className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl"
        style={{
          boxShadow: `0 10px 55px -10px ${theme.primaryColor}55, 0 0 0 1px ${theme.primaryColor}25, 0 4px 25px -5px rgba(0,0,0,0.4)`,
        }}
        animate={{
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {allNav.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          // Add separator after primary nav
          const showSeparator = index === PRIMARY_NAV.length - 1;

          return (
            <div key={item.href} className="flex items-center">
              <Link href={item.href} className="relative group">
                <motion.div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-colors relative",
                    active
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {active && (
                    <motion.div
                      layoutId="desktop-pill-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: theme.primaryColor }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    />
                  )}
                  <Icon className="h-5 w-5 relative z-10" />
                </motion.div>
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                  {item.label}
                </div>
              </Link>
              
              {showSeparator && (
                <div className="w-px h-6 bg-border mx-2" />
              )}
            </div>
          );
        })}
      </motion.div>
    </nav>
  );
}
