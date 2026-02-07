"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
  duration = 1,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  formatFn,
  delay = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Check if element is in view using IntersectionObserver (more performant than framer-motion)
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          // Start animation after delay
          const timeout = setTimeout(() => {
            animateValue(0, value, duration * 1000);
            setHasAnimated(true);
          }, delay * 1000);
          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value, duration, delay, hasAnimated]);

  // Update value if it changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      animateValue(displayValue, value, 300); // Quick update
    }
  }, [value]);

  const animateValue = (start: number, end: number, animDuration: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formattedValue = useMemo(() => {
    if (formatFn) {
      return formatFn(displayValue);
    }
    return displayValue.toFixed(decimals);
  }, [displayValue, formatFn, decimals]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <span>{formattedValue}</span>
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
        <span
          className={cn(
            "text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300",
            isPositive && "text-green-500",
            isNegative && "text-red-500"
          )}
        >
          {showSign && (isPositive ? "+" : "")}
          {delta.toFixed(decimals)}
        </span>
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
