"use client";

import { motion } from "framer-motion";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";

interface DynamicBackgroundProps {
  className?: string;
}

export function DynamicBackground({ className }: DynamicBackgroundProps) {
  const { theme } = useCircuitTheme();

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Base gradient layer - MORE VIBRANT */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        key={theme.id} // Re-animate on theme change
        style={{
          background: `linear-gradient(${theme.gradientAngle}deg,
            ${theme.primaryColor}40 0%,
            ${theme.secondaryColor}25 50%,
            transparent 100%)`,
        }}
      />

      {/* Animated orb 1 - Primary color - LARGER & MORE VISIBLE */}
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: "50vw",
          height: "50vw",
          background: `radial-gradient(circle, ${theme.primaryColor}50 0%, transparent 70%)`,
        }}
        animate={{
          x: ["-10vw", "10vw", "-10vw"],
          y: ["-5vh", "15vh", "-5vh"],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ x: "-10vw", y: "-5vh" }}
      />

      {/* Animated orb 2 - Secondary color - MORE VISIBLE */}
      <motion.div
        className="absolute right-0 bottom-0 rounded-full blur-[80px]"
        style={{
          width: "45vw",
          height: "45vw",
          background: `radial-gradient(circle, ${theme.secondaryColor}40 0%, transparent 70%)`,
        }}
        animate={{
          x: ["10vw", "-10vw", "10vw"],
          y: ["10vh", "-10vh", "10vh"],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ x: "10vw", y: "10vh" }}
      />

      {/* Animated orb 3 - Accent color - MORE VISIBLE */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full blur-[60px]"
        style={{
          width: "30vw",
          height: "30vw",
          background: `radial-gradient(circle, ${theme.accentColor}25 0%, transparent 70%)`,
        }}
        animate={{
          x: ["-20vw", "20vw", "-20vw"],
          y: ["-15vh", "15vh", "-15vh"],
          scale: [0.8, 1.3, 0.8],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ x: "-20vw", y: "-15vh" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(${theme.primaryColor}60 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primaryColor}60 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Softer vignette - less aggressive fade */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, var(--background) 100%)`,
        }}
      />
    </div>
  );
}

// Simpler version for cards/widgets
export function GlassCard({
  children,
  className,
  intensity = "medium",
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "strong";
}) {
  const { theme } = useCircuitTheme();

  const intensityStyles = {
    light: {
      background: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.05)",
      blur: "8px",
    },
    medium: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "rgba(255, 255, 255, 0.08)",
      blur: "12px",
    },
    strong: {
      background: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.12)",
      blur: "16px",
    },
  };

  const style = intensityStyles[intensity];

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: style.background,
        backdropFilter: `blur(${style.blur})`,
        WebkitBackdropFilter: `blur(${style.blur})`,
        border: `1px solid ${style.border}`,
        boxShadow: `
          0 0 0 1px ${theme.primaryColor}05,
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06),
          inset 0 1px 0 ${theme.accentColor}05
        `,
      }}
    >
      {/* Subtle gradient accent at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.primaryColor}30, transparent)`,
        }}
      />
      {children}
    </div>
  );
}

// Accent line component for visual flair
export function AccentLine({
  position = "top",
  animated = false,
}: {
  position?: "top" | "bottom" | "left" | "right";
  animated?: boolean;
}) {
  const { theme } = useCircuitTheme();

  const positionStyles = {
    top: "top-0 left-0 right-0 h-0.5",
    bottom: "bottom-0 left-0 right-0 h-0.5",
    left: "top-0 bottom-0 left-0 w-0.5",
    right: "top-0 bottom-0 right-0 w-0.5",
  };

  const gradientDirection = position === "top" || position === "bottom" ? "90deg" : "180deg";

  if (animated) {
    return (
      <motion.div
        className={`absolute ${positionStyles[position]}`}
        style={{
          background: `linear-gradient(${gradientDirection}, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor})`,
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    );
  }

  return (
    <div
      className={`absolute ${positionStyles[position]}`}
      style={{
        background: `linear-gradient(${gradientDirection}, transparent, ${theme.primaryColor}, transparent)`,
      }}
    />
  );
}
