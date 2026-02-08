"use client";

import { useEffect, useState } from "react";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";

interface DynamicBackgroundProps {
  className?: string;
}

export function DynamicBackground({ className }: DynamicBackgroundProps) {
  const { theme } = useCircuitTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient layer - more prominent theme colors */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `linear-gradient(${theme.gradientAngle}deg,
            ${theme.primaryColor}55 0%,
            ${theme.secondaryColor}40 50%,
            transparent 100%)`,
        }}
      />

      {/* Optimized orbs - more prominent theme colors */}
      {/* Orb 1 - Primary color */}
      <div
        className="dynamic-bg-orb absolute will-change-transform"
        style={{
          width: "min(55vw, 550px)",
          height: "min(55vw, 550px)",
          left: "-10%",
          top: "-10%",
          background: `radial-gradient(circle, ${theme.primaryColor}65 0%, transparent 60%)`,
          filter: "blur(50px)",
          animation: prefersReducedMotion ? "none" : "float1 30s ease-in-out infinite",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Orb 2 - Secondary color */}
      <div
        className="dynamic-bg-orb absolute will-change-transform"
        style={{
          width: "min(50vw, 500px)",
          height: "min(50vw, 500px)",
          right: "-10%",
          bottom: "-10%",
          background: `radial-gradient(circle, ${theme.secondaryColor}55 0%, transparent 60%)`,
          filter: "blur(50px)",
          animation: prefersReducedMotion ? "none" : "float2 35s ease-in-out infinite",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Orb 3 - Accent color */}
      <div
        className="dynamic-bg-orb absolute will-change-transform"
        style={{
          width: "min(30vw, 300px)",
          height: "min(30vw, 300px)",
          left: "40%",
          top: "30%",
          background: `radial-gradient(circle, ${theme.accentColor}45 0%, transparent 60%)`,
          filter: "blur(40px)",
          animation: prefersReducedMotion ? "none" : "float3 40s ease-in-out infinite",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Grid pattern - more visible */}
      <div
        className="dynamic-bg-grid absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(${theme.primaryColor}70 1px, transparent 1px),
            linear-gradient(90deg, ${theme.primaryColor}70 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette - static, no animation */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, var(--background) 100%)`,
        }}
      />

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(10vw, 10vh, 0) scale(1.1);
          }
        }
        
        @keyframes float2 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1.05);
          }
          50% {
            transform: translate3d(-10vw, -10vh, 0) scale(0.95);
          }
        }
        
        @keyframes float3 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.9);
          }
          33% {
            transform: translate3d(15vw, -10vh, 0) scale(1.1);
          }
          66% {
            transform: translate3d(-10vw, 10vh, 0) scale(1);
          }
        }
      `}</style>
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
          0 0 0 1px ${theme.primaryColor}15,
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06),
          inset 0 1px 0 ${theme.accentColor}15
        `,
      }}
    >
      {/* Subtle gradient accent at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.primaryColor}50, transparent)`,
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
    const animationName = position === "top" || position === "bottom"
      ? "accentLineHorizontal"
      : "accentLineVertical";
    
    return (
      <>
        <div
          className={`absolute ${positionStyles[position]}`}
          style={{
            background: `linear-gradient(${gradientDirection}, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor})`,
            backgroundSize: "200% 100%",
            animation: `${animationName} 3s linear infinite`,
          }}
        />
        <style jsx>{`
          @keyframes accentLineHorizontal {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 100% 0%; }
          }
          @keyframes accentLineVertical {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 0% 100%; }
          }
        `}</style>
      </>
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
