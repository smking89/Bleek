"use client";

import type { CSSProperties, ReactNode } from "react";
import type { DecorationKey } from "@/lib/types";

const maskFor = (thickness: number) =>
  `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`;

function Ring({
  thickness,
  background,
  inset = 0,
  animation,
  blur = 0,
  opacity = 1,
}: {
  thickness: number;
  background: string;
  inset?: number;
  animation?: string;
  blur?: number;
  opacity?: number;
}) {
  const style: CSSProperties = {
    position: "absolute",
    inset,
    borderRadius: "9999px",
    background,
    WebkitMaskImage: maskFor(thickness),
    maskImage: maskFor(thickness),
    animation,
    filter: blur ? `blur(${blur}px)` : undefined,
    opacity,
  };
  return <div style={style} />;
}

/**
 * Places `count` nodes evenly around a circle. Each node is anchored to the top
 * edge of the wrapper, so the wrapper can be rotated as a group.
 */
function orbit(count: number, render: (index: number) => ReactNode, offset = 0): ReactNode[] {
  return Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      style={{ position: "absolute", inset: 0, transform: `rotate(${(360 / count) * i + offset}deg)` }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {render(i)}
      </div>
    </div>
  ));
}

export function AvatarDecoration({
  kind,
  size,
  className = "",
}: {
  kind: DecorationKey | null | undefined;
  size: number;
  className?: string;
}) {
  if (!kind) return null;

  const t = Math.max(2, size * 0.05);
  const pad = Math.round(size * 0.06);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ inset: -pad }}
    >
      {kind === "aurora-halo" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 2.5,
              borderRadius: "9999px",
              background: "conic-gradient(from 0deg,#34d399,#22d3ee,#818cf8,#f472b6,#34d399)",
              filter: `blur(${Math.max(3, size * 0.08)}px)`,
              opacity: 0.5,
              animation: "nebula-spin 11s linear infinite",
            }}
          />
          <Ring
            thickness={t}
            background="conic-gradient(from 0deg,#6ee7b7,#67e8f9,#a5b4fc,#f9a8d4,#6ee7b7)"
            animation="nebula-spin 7s linear infinite"
          />
          <Ring
            thickness={Math.max(1, t * 0.4)}
            inset={t * 1.6}
            background="conic-gradient(from 180deg,#ffffff,#99f6e4,#ffffff)"
            animation="nebula-spin-rev 12s linear infinite"
            opacity={0.7}
          />
        </>
      )}

      {kind === "ember-crown" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 2,
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(251,146,60,0.55), transparent 68%)",
              filter: `blur(${Math.max(3, size * 0.07)}px)`,
              animation: "nebula-pulse 2.8s ease-in-out infinite",
            }}
          />
          <Ring
            thickness={t}
            background="conic-gradient(from 200deg,#7f1d1d,#f97316,#fbbf24,#f97316,#7f1d1d)"
            animation="nebula-spin 16s linear infinite"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${22 + i * 14}%`,
                top: `${-6 - (i % 2) * 7}%`,
                width: size * 0.11,
                height: size * 0.19,
                borderRadius: "60% 60% 45% 45% / 70% 70% 35% 35%",
                background: "linear-gradient(180deg,#fde68a,#fb923c 55%,rgba(239,68,68,0))",
                filter: `blur(${Math.max(0.6, size * 0.012)}px)`,
                animation: `nebula-flicker ${1.6 + i * 0.21}s ease-in-out ${i * 0.13}s infinite`,
                transformOrigin: "50% 100%",
              }}
            />
          ))}
        </>
      )}

      {kind === "stardust-orbit" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 2,
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(167,139,250,0.45), transparent 70%)",
              filter: `blur(${Math.max(3, size * 0.08)}px)`,
              animation: "nebula-pulse 5s ease-in-out infinite",
            }}
          />
          <Ring
            thickness={Math.max(1.4, t * 0.7)}
            background="conic-gradient(from 0deg,#c4b5fd,#f0abfc,#c4b5fd)"
            animation="nebula-spin 9s linear infinite"
          />
          <Ring
            thickness={Math.max(1.4, t * 0.7)}
            inset={t * 1.8}
            background="conic-gradient(from 90deg,#818cf8,#67e8f9,#818cf8)"
            animation="nebula-spin-rev 13s linear infinite"
          />
          <Ring
            thickness={Math.max(1, t * 0.4)}
            inset={t * 2.4}
            background="conic-gradient(from 220deg,#fef9c3,#fde68a,#fef9c3)"
            animation="nebula-spin 21s linear infinite"
            opacity={0.8}
          />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin 26s linear infinite" }}>
            {orbit(6, (i) => (
              <span
                style={{
                  width: Math.max(2.5, size * 0.05),
                  height: Math.max(2.5, size * 0.05),
                  borderRadius: "9999px",
                  background: i % 2 ? "#fef9c3" : "#ffffff",
                  boxShadow: `0 0 ${size * 0.08}px #fde68a`,
                  animation: `nebula-twinkle ${2.2 + i * 0.35}s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {kind === "sakura-bloom" && (
        <>
          <Ring
            thickness={Math.max(1.2, t * 0.6)}
            background="conic-gradient(from 0deg,#fbcfe8,#f9a8d4,#fda4af,#fbcfe8)"
            animation="nebula-spin 14s linear infinite"
            opacity={0.9}
          />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin 40s linear infinite" }}>
            {orbit(8, (i) => (
              <span
                style={{
                  width: size * 0.12,
                  height: size * 0.17,
                  borderRadius: "100% 0 100% 0",
                  background: "linear-gradient(140deg,#fce7f3,#f9a8d4 60%,#fb7185)",
                  boxShadow: "0 0 6px rgba(249,168,212,0.6)",
                  transform: `rotate(${i % 2 ? 30 : -25}deg)`,
                  animation: `nebula-flicker ${3 + i * 0.3}s ease-in-out ${i * 0.25}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {kind === "static-surge" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 2.4,
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(250,204,21,0.4), transparent 66%)",
              filter: `blur(${Math.max(3, size * 0.07)}px)`,
              animation: "nebula-pulse 1.8s ease-in-out infinite",
            }}
          />
          <Ring
            thickness={t}
            background="conic-gradient(from 0deg,#a16207,#facc15,#fef08a,#eab308,#a16207)"
            animation="nebula-spin 6s linear infinite"
          />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin 9s linear infinite" }}>
            {orbit(4, (i) => (
              <span
                style={{
                  width: size * 0.18,
                  height: size * 0.26,
                  background: "linear-gradient(160deg,#fef9c3,#facc15)",
                  clipPath: "polygon(52% 0%, 12% 56%, 46% 56%, 30% 100%, 92% 40%, 54% 40%)",
                  filter: "drop-shadow(0 0 4px rgba(250,204,21,0.9))",
                  animation: `nebula-pulse ${0.9 + i * 0.25}s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {kind === "glacier-ring" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 2,
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(125,211,252,0.4), transparent 68%)",
              filter: `blur(${Math.max(3, size * 0.07)}px)`,
              animation: "nebula-glow 4s ease-in-out infinite",
            }}
          />
          <Ring
            thickness={t}
            background="conic-gradient(from 0deg,#e0f2fe,#7dd3fc,#0ea5e9,#bae6fd,#e0f2fe)"
            animation="nebula-spin 12s linear infinite"
          />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin-rev 24s linear infinite" }}>
            {orbit(6, (i) => (
              <span
                style={{
                  width: size * 0.09,
                  height: size * 0.09,
                  transform: "rotate(45deg)",
                  background: "linear-gradient(135deg,#f0f9ff,#7dd3fc)",
                  boxShadow: "0 0 6px rgba(125,211,252,0.9)",
                  animation: `nebula-twinkle ${2.6 + i * 0.4}s ease-in-out ${i * 0.28}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {kind === "thorn-wreath" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 2.6,
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(220,38,38,0.42), transparent 66%)",
              filter: `blur(${Math.max(4, size * 0.09)}px)`,
              animation: "nebula-pulse 3.4s ease-in-out infinite",
            }}
          />
          <Ring thickness={Math.max(1.6, t * 0.8)} background="conic-gradient(from 0deg,#18181b,#7f1d1d,#dc2626,#7f1d1d,#18181b)" />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin 34s linear infinite" }}>
            {orbit(14, (i) => (
              <span
                style={{
                  width: size * 0.1,
                  height: size * 0.2,
                  background: "linear-gradient(180deg,#f87171,#7f1d1d 70%,#18181b)",
                  clipPath:
                    i % 2 === 0
                      ? "polygon(50% 0%, 100% 100%, 0% 100%)"
                      : "polygon(0% 0%, 100% 0%, 50% 100%)",
                  transform: `rotate(${i % 2 === 0 ? 0 : 180}deg)`,
                  filter: "drop-shadow(0 0 3px rgba(220,38,38,0.65))",
                }}
              />
            ))}
          </div>
        </>
      )}

      {kind === "neon-haze" && (
        <>
          <Ring
            thickness={t}
            inset={-t * 0.5}
            background="conic-gradient(from 0deg,rgba(34,211,238,0),#22d3ee 30%,rgba(34,211,238,0) 55%,#22d3ee 85%,rgba(34,211,238,0))"
            animation="nebula-spin 4.5s linear infinite"
            blur={Math.max(0.4, size * 0.012)}
          />
          <Ring
            thickness={Math.max(1.2, t * 0.7)}
            inset={-t * 1.8}
            background="conic-gradient(from 180deg,rgba(168,85,247,0),#a855f7 40%,rgba(168,85,247,0) 70%,#a855f7)"
            animation="nebula-spin-rev 7s linear infinite"
            blur={Math.max(0.6, size * 0.016)}
          />
        </>
      )}

      {kind === "lunar-eclipse" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -t * 3,
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(226,232,240,0.55), transparent 65%)",
              filter: `blur(${Math.max(4, size * 0.1)}px)`,
              animation: "nebula-glow 6s ease-in-out infinite",
            }}
          />
          <Ring
            thickness={t}
            background="conic-gradient(from 0deg,#e2e8f0,#94a3b8,#f8fafc,#cbd5e1,#e2e8f0)"
            animation="nebula-spin 18s linear infinite"
          />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin 26s linear infinite" }}>
            {orbit(1, () => (
              <span
                style={{
                  width: size * 0.2,
                  height: size * 0.2,
                  borderRadius: "9999px",
                  background: "radial-gradient(circle at 62% 38%, #0f172a 42%, #475569 60%, #e2e8f0 68%)",
                  boxShadow: `0 0 ${size * 0.12}px rgba(226,232,240,0.9)`,
                  animation: "nebula-twinkle 7s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        </>
      )}

      {kind === "pixel-pals" && (
        <>
          <Ring
            thickness={Math.max(1, t * 0.45)}
            background="conic-gradient(from 0deg,#a3e635,#4ade80,#22d3ee,#a3e635)"
            animation="nebula-spin 15s linear infinite"
            opacity={0.85}
          />
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin 8s linear infinite" }}>
            {orbit(4, (i) => (
              <span
                style={{
                  width: size * 0.13,
                  height: size * 0.13,
                  borderRadius: Math.max(1.5, size * 0.02),
                  background: ["#a3e635", "#f472b6", "#38bdf8", "#facc15"][i],
                  boxShadow: "0 0 4px rgba(0,0,0,0.4)",
                  animation: `nebula-blip ${1.8 + i * 0.3}s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, animation: "nebula-spin-rev 11s linear infinite" }}>
            {orbit(4, (i) => (
              <span
                style={{
                  width: size * 0.08,
                  height: size * 0.08,
                  borderRadius: 1,
                  background: ["#fb7185", "#c084fc", "#34d399", "#fbbf24"][i],
                  animation: `nebula-twinkle ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
