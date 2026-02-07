"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  showArea?: boolean;
  showDots?: boolean;
  showLastValue?: boolean;
  animated?: boolean;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  className,
  color,
  showArea = true,
  showDots = false,
  showLastValue = false,
  animated = true,
  strokeWidth = 2,
}: SparklineProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const { theme } = useCircuitTheme();

  const lineColor = color || theme.primaryColor;

  if (!data || data.length === 0) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Add padding to prevent clipping
  const padding = { top: 4, bottom: 4, left: 2, right: showLastValue ? 30 : 2 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate points
  const points = data.map((value, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y, value };
  });

  // Generate path
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Generate area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  const lastPoint = points[points.length - 1];
  const trend = data.length > 1 ? data[data.length - 1] - data[0] : 0;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        ref={ref}
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          <linearGradient
            id={`sparkline-gradient-${lineColor.replace("#", "")}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill={`url(#sparkline-gradient-${lineColor.replace("#", "")})`}
            initial={animated ? { opacity: 0 } : undefined}
            animate={isInView ? { opacity: 1 } : undefined}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
          animate={isInView ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Dots */}
        {showDots &&
          points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={3}
              fill={lineColor}
              initial={animated ? { scale: 0, opacity: 0 } : undefined}
              animate={isInView ? { scale: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
            />
          ))}

        {/* Last point highlight */}
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={4}
          fill={lineColor}
          initial={animated ? { scale: 0 } : undefined}
          animate={isInView ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.8 }}
        />
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={6}
          fill={lineColor}
          opacity={0.3}
          initial={animated ? { scale: 0 } : undefined}
          animate={isInView ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.8 }}
        />
      </svg>

      {showLastValue && (
        <motion.span
          className={cn(
            "text-sm font-medium tabular-nums",
            trend > 0 && "text-green-500",
            trend < 0 && "text-red-500",
            trend === 0 && "text-muted-foreground"
          )}
          initial={animated ? { opacity: 0, x: -10 } : undefined}
          animate={isInView ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.3, delay: 1 }}
        >
          {lastPoint.value}
        </motion.span>
      )}
    </div>
  );
}

// Mini sparkline for table cells
export function MiniSparkline({
  data,
  trend,
  className,
}: {
  data: number[];
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  const { theme } = useCircuitTheme();

  const trendColors = {
    up: "#22c55e",
    down: "#ef4444",
    neutral: theme.primaryColor,
  };

  const detectedTrend =
    trend ||
    (data.length > 1
      ? data[data.length - 1] > data[0]
        ? "up"
        : data[data.length - 1] < data[0]
        ? "down"
        : "neutral"
      : "neutral");

  return (
    <Sparkline
      data={data}
      width={60}
      height={20}
      color={trendColors[detectedTrend]}
      showArea={false}
      strokeWidth={1.5}
      className={className}
    />
  );
}

// Sparkline with comparison
export function ComparisonSparkline({
  data1,
  data2,
  label1,
  label2,
  color1,
  color2,
  width = 200,
  height = 60,
  className,
}: {
  data1: number[];
  data2: number[];
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const { theme } = useCircuitTheme();
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });

  const lineColor1 = color1 || theme.primaryColor;
  const lineColor2 = color2 || theme.secondaryColor;

  const allData = [...data1, ...data2];
  const min = Math.min(...allData);
  const max = Math.max(...allData);
  const range = max - min || 1;

  const padding = { top: 8, bottom: 8, left: 4, right: 4 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const generatePath = (data: number[]) => {
    return data
      .map((value, index) => {
        const x = padding.left + (index / (data.length - 1)) * chartWidth;
        const y =
          padding.top + chartHeight - ((value - min) / range) * chartHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <svg ref={ref} width={width} height={height}>
        <motion.path
          d={generatePath(data1)}
          fill="none"
          stroke={lineColor1}
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : undefined}
          transition={{ duration: 1 }}
        />
        <motion.path
          d={generatePath(data2)}
          fill="none"
          stroke={lineColor2}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : undefined}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </svg>
      {(label1 || label2) && (
        <div className="flex gap-4 text-xs">
          {label1 && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-4 rounded"
                style={{ backgroundColor: lineColor1 }}
              />
              {label1}
            </span>
          )}
          {label2 && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-4 rounded"
                style={{
                  backgroundColor: lineColor2,
                  backgroundImage: `repeating-linear-gradient(90deg, ${lineColor2}, ${lineColor2} 4px, transparent 4px, transparent 6px)`,
                }}
              />
              {label2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
