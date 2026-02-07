"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatFn?: (value: number) => string;
  delay?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  formatFn,
  delay = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => {
    if (formatFn) {
      return formatFn(current);
    }
    return current.toFixed(decimals);
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, spring, hasAnimated, delay]);

  // Update value if it changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      spring.set(value);
    }
  }, [value, spring, hasAnimated]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Specialized counter for lap times (mm:ss.xxx)
export function LapTimeCounter({
  value,
  className,
  duration = 1,
}: {
  value: number; // in seconds
  className?: string;
  duration?: number;
}) {
  const formatLapTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
  };

  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={cn("font-mono", className)}
      formatFn={formatLapTime}
    />
  );
}

// Counter with delta indicator
export function DeltaCounter({
  value,
  previousValue,
  className,
  duration = 1,
  decimals = 0,
  showSign = true,
}: {
  value: number;
  previousValue?: number;
  className?: string;
  duration?: number;
  decimals?: number;
  showSign?: boolean;
}) {
  const delta = previousValue !== undefined ? value - previousValue : 0;
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AnimatedCounter value={value} duration={duration} decimals={decimals} />
      {previousValue !== undefined && delta !== 0 && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "text-sm font-medium",
            isPositive && "text-green-500",
            isNegative && "text-red-500"
          )}
        >
          {showSign && (isPositive ? "+" : "")}
          {delta.toFixed(decimals)}
        </motion.span>
      )}
    </div>
  );
}

// Position counter with ordinal suffix
export function PositionCounter({
  value,
  className,
  duration = 0.8,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <span className={cn("tabular-nums", className)}>
      <AnimatedCounter value={value} duration={duration} decimals={0} />
      <span className="text-muted-foreground text-sm ml-0.5">
        {getOrdinalSuffix(value)}
      </span>
    </span>
  );
}

// Points counter with animation
export function PointsCounter({
  value,
  className,
  size = "default",
}: {
  value: number;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <AnimatedCounter
        value={value}
        duration={1.2}
        decimals={0}
        className={cn("font-bold", sizeClasses[size])}
      />
      <span className="text-muted-foreground text-sm">pts</span>
    </div>
  );
}
