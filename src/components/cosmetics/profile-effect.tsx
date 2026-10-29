"use client";

import type { EffectKey } from "@/lib/types";

const SPARK_COLORS = ["#fbbf24", "#f472b6", "#60a5fa", "#4ade80", "#c084fc", "#f87171", "#facc15", "#22d3ee"];

export function ProfileEffect({
  kind,
  className = "",
  intensity = 1,
}: {
  kind: EffectKey | null | undefined;
  className?: string;
  intensity?: number;
}) {
  if (!kind) return null;

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ opacity: intensity }}>
      {kind === "soft-glow" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(120% 90% at 18% 0%, rgba(147,197,253,0.55), transparent 62%)",
              animation: "nebula-pulse 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(90% 70% at 82% 20%, rgba(196,181,253,0.4), transparent 60%)",
              animation: "nebula-pulse 8s ease-in-out 1.4s infinite",
            }}
          />
        </>
      )}

      {kind === "aurora-drift" && (
        <>
          <div
            className="absolute -inset-x-1/3 -top-1/2 h-[130%]"
            style={{
              background: "linear-gradient(100deg, transparent, #2dd4bf 35%, #6366f1 60%, transparent)",
              filter: "blur(22px)",
              opacity: 0.55,
              animation: "nebula-drift 14s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -inset-x-1/3 top-0 h-[120%]"
            style={{
              background: "linear-gradient(80deg, transparent, #a855f7 40%, #22d3ee 65%, transparent)",
              filter: "blur(26px)",
              opacity: 0.4,
              animation: "nebula-drift 19s ease-in-out 2s infinite reverse",
            }}
          />
        </>
      )}

      {kind === "starfall" && (
        <div className="absolute inset-0">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${6 + ((i * 37) % 88)}%`,
                top: `${(i * 23) % 40}%`,
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                boxShadow: "0 0 6px rgba(255,255,255,0.9), 0 0 14px rgba(196,181,253,0.7)",
                animation: `nebula-fall ${3.4 + (i % 5) * 0.7}s linear ${i * 0.45}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {kind === "ember-sparks" && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(0deg, rgba(251,113,133,0.3), transparent 65%)" }}
          />
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${4 + ((i * 41) % 92)}%`,
                bottom: `${(i * 17) % 12}%`,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                background: i % 2 ? "#fbbf24" : "#fb923c",
                boxShadow: "0 0 8px rgba(251,146,60,0.95)",
                animation: `nebula-rise ${2.8 + (i % 4) * 0.6}s ease-out ${i * 0.28}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {kind === "confetti-burst" && (
        <div className="absolute inset-0">
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${3 + ((i * 29) % 94)}%`,
                top: `-8%`,
                width: i % 4 === 0 ? 3 : 5,
                height: i % 3 === 0 ? 3 : 9,
                borderRadius: i % 5 === 0 ? "9999px" : 1,
                background: SPARK_COLORS[i % SPARK_COLORS.length],
                animation: `nebula-fall ${4 + (i % 6) * 0.55}s linear ${i * 0.32}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {kind === "rgb-wave" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, #f472b6, #facc15, #4ade80, #22d3ee, #a78bfa, #f472b6)",
              backgroundSize: "300% 100%",
              opacity: 0.28,
              filter: "blur(6px)",
              animation: "nebula-shimmer 9s linear infinite",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(115deg, transparent, rgba(255,255,255,0.35), transparent)",
              backgroundSize: "250% 100%",
              opacity: 0.5,
              animation: "nebula-shimmer 5s linear infinite",
            }}
          />
        </>
      )}
    </div>
  );
}
