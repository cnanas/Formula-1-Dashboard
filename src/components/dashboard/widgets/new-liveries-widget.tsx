"use client";

import { useSeason } from "@/providers/season-provider";

export function NewLiveriesWidget() {
  const { season } = useSeason();

  return (
    <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-red-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(239,68,68,0.3),transparent_70%)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center p-6 text-white">
        <p className="text-sm font-medium text-white/60 mb-1">{season}</p>
        <h3 className="text-3xl font-bold leading-tight">
          New
          <br />
          Liveries
        </h3>
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-white/70 bg-white/10 rounded-full px-3 py-1 hover:bg-white/20 transition-colors cursor-pointer">
            Explore
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>

      {/* Decorative car silhouette */}
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10">
        <svg viewBox="0 0 200 100" className="w-full h-full" fill="white">
          <path d="M20 70 L40 50 L60 45 L80 40 L120 40 L150 45 L170 55 L180 65 L180 75 L20 75 Z" />
          <circle cx="55" cy="75" r="12" />
          <circle cx="155" cy="75" r="12" />
        </svg>
      </div>
    </div>
  );
}
