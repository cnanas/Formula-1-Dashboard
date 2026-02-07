"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  label?: string;
  animated?: boolean;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 8,
  className,
  color,
  backgroundColor,
  showValue = true,
  valuePrefix = "",
  valueSuffix = "%",
  label,
  animated = true,
  children,
}: ProgressRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const { theme } = useCircuitTheme();

  const ringColor = color || theme.primaryColor;
  const bgColor = backgroundColor || `${ringColor}20`;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        ref={ref}
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={isInView ? { strokeDashoffset: offset } : undefined}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showValue && (
              <motion.span
                className="text-lg font-bold tabular-nums"
                initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
                animate={isInView ? { opacity: 1, scale: 1 } : undefined}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {valuePrefix}
                {Math.round(clampedValue)}
                {valueSuffix}
              </motion.span>
            )}
            {label && (
              <span className="text-xs text-muted-foreground">{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Multi-segment progress ring (like for tire wear)
export function SegmentedProgressRing({
  segments,
  size = 100,
  strokeWidth = 10,
  gap = 4,
  className,
  label,
}: {
  segments: { value: number; color: string; label?: string }[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  className?: string;
  label?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const totalGap = gap * segments.length;
  const availableCircumference = circumference - totalGap;
  const segmentLength = availableCircumference / segments.length;

  let currentOffset = 0;

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-2", className)}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        {segments.map((segment, index) => {
          const segmentOffset = currentOffset;
          const filledLength = (segment.value / 100) * segmentLength;
          currentOffset += segmentLength + gap;

          return (
            <g key={index}>
              {/* Background segment */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`${segment.color}30`}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-segmentOffset}
                strokeLinecap="round"
              />
              {/* Filled segment */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${filledLength} ${circumference - filledLength}`}
                strokeDashoffset={-segmentOffset}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={
                  isInView
                    ? { strokeDasharray: `${filledLength} ${circumference - filledLength}` }
                    : undefined
                }
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </g>
          );
        })}
      </svg>

      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">
              {segment.label || `${segment.value}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Comparison ring (two values overlaid)
export function ComparisonRing({
  value1,
  value2,
  label1,
  label2,
  color1,
  color2,
  size = 100,
  strokeWidth = 8,
  className,
}: {
  value1: number;
  value2: number;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const { theme } = useCircuitTheme();

  const ringColor1 = color1 || theme.primaryColor;
  const ringColor2 = color2 || theme.secondaryColor;

  const radius1 = (size - strokeWidth) / 2;
  const radius2 = radius1 - strokeWidth - 4;
  const circumference1 = radius1 * 2 * Math.PI;
  const circumference2 = radius2 * 2 * Math.PI;

  const offset1 = circumference1 - (value1 / 100) * circumference1;
  const offset2 = circumference2 - (value2 / 100) * circumference2;

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-2", className)}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        {/* Outer ring background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius1}
          fill="none"
          stroke={`${ringColor1}20`}
          strokeWidth={strokeWidth}
        />
        {/* Outer ring progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius1}
          fill="none"
          stroke={ringColor1}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference1}
          initial={{ strokeDashoffset: circumference1 }}
          animate={isInView ? { strokeDashoffset: offset1 } : undefined}
          transition={{ duration: 1.2 }}
        />

        {/* Inner ring background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius2}
          fill="none"
          stroke={`${ringColor2}20`}
          strokeWidth={strokeWidth}
        />
        {/* Inner ring progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius2}
          fill="none"
          stroke={ringColor2}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference2}
          initial={{ strokeDashoffset: circumference2 }}
          animate={isInView ? { strokeDashoffset: offset2 } : undefined}
          transition={{ duration: 1.2, delay: 0.2 }}
        />
      </svg>

      {/* Center values */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color: ringColor1 }}>
          {Math.round(value1)}%
        </span>
        <span className="text-sm" style={{ color: ringColor2 }}>
          {Math.round(value2)}%
        </span>
      </div>

      {/* Legend */}
      {(label1 || label2) && (
        <div className="flex gap-4 text-xs">
          {label1 && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ringColor1 }}
              />
              {label1}
            </span>
          )}
          {label2 && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ringColor2 }}
              />
              {label2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
