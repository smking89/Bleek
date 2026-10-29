import type { ReactNode } from "react";
import type { CharacterKey } from "@/lib/types";

/**
 * Character art is drawn inside a 40×40 box so the avatar's circular frame can
 * clip it. Busts are anchored to the bottom edge, the way a portrait crop would
 * be, and every palette is deliberately opaque so it reads against any avatar
 * gradient the user picks.
 */

const INK = "#20242e";

/** Shoulders, neck, ears and head — the part every human character shares. */
function Bust({
  skin,
  cloth,
  shade,
  robot = false,
}: {
  skin: string;
  cloth: string;
  shade: string;
  robot?: boolean;
}) {
  return (
    <>
      <path d="M20 24.6c-9.4 0-16.2 6.2-16.2 13.9V40h32.4v-1.5c0-7.7-6.8-13.9-16.2-13.9z" fill={cloth} />
      <ellipse cx="20" cy="27.2" rx="6.6" ry="3.6" fill={shade} opacity="0.5" />
      {!robot && (
        <>
          <path d="M17.1 20.4h5.8v5.6c0 1.6-1.3 2.6-2.9 2.6s-2.9-1-2.9-2.6z" fill={skin} />
          <ellipse cx="20" cy="16.2" rx="7.6" ry="8.2" fill={skin} />
          <circle cx="13" cy="17.6" r="1.5" fill={skin} />
          <circle cx="27" cy="17.6" r="1.5" fill={skin} />
        </>
      )}
    </>
  );
}

function Face({ ink = INK, mouth = "#bd6660" }: { ink?: string; mouth?: string }) {
  return (
    <>
      <ellipse cx="17.1" cy="16.5" rx="1.1" ry="1.3" fill={ink} />
      <ellipse cx="22.9" cy="16.5" rx="1.1" ry="1.3" fill={ink} />
      <circle cx="17.45" cy="16.05" r="0.36" fill="#ffffff" opacity="0.92" />
      <circle cx="23.25" cy="16.05" r="0.36" fill="#ffffff" opacity="0.92" />
      <path
        d="M18.2 19.9c.55.6 1.2.9 1.8.9s1.25-.3 1.8-.9"
        fill="none"
        stroke={mouth}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <ellipse cx="14.7" cy="18.9" rx="1.4" ry="0.8" fill="#e8837a" opacity="0.3" />
      <ellipse cx="25.3" cy="18.9" rx="1.4" ry="0.8" fill="#e8837a" opacity="0.3" />
    </>
  );
}

/** Hair cap: a half circle over the skull with a gentle fringe across the brow. */
const CAP = "M11.5 13.2A8.5 8.5 0 0 1 28.5 13.2Q20 14.2 11.5 13.2Z";

export const CHARACTERS: Record<CharacterKey, ReactNode> = {
  comet: (
    <>
      <Bust skin="#f4c8a3" cloth="#4f46e5" shade="#3c35b8" />
      <Face />
      <path d={CAP} fill="#1c2433" />
      <path d="M16.4 7.6c2.2-3.2 5.6-3.9 7.9-2.4-2.8.2-5.2 1.2-6.9 3.2z" fill="#2c3a52" />
      <path d="M12.6 12.9c.1-2.9 1.6-5 4.2-6.1-1.3 1.8-2 3.8-2 5.9z" fill="#1c2433" />
    </>
  ),
  orbit: (
    <>
      <circle cx="20" cy="13.4" r="10" fill="#2a1a12" />
      <Bust skin="#8d5a3b" cloth="#0f766e" shade="#0a5750" />
      <path d={CAP} fill="#2a1a12" />
      <Face />
      <g fill="none" stroke="#facc15" strokeWidth="1.1">
        <circle cx="17.1" cy="16.5" r="2.7" />
        <circle cx="22.9" cy="16.5" r="2.7" />
        <path d="M19.8 16.5h.4" />
        <path d="M14.3 15.6 12.4 14.6M25.7 15.6l1.9-1" />
      </g>
    </>
  ),
  petal: (
    <>
      <Bust skin="#fbd9bd" cloth="#db2777" shade="#b01b60" />
      <path d="M10.2 12.6h4.2v12.2a2.1 2.1 0 0 1-4.2 0z" fill="#f472b6" />
      <path d="M25.6 12.6h4.2v12.2a2.1 2.1 0 0 1-4.2 0z" fill="#f472b6" />
      <path d={CAP} fill="#f472b6" />
      <Face mouth="#c2547d" />
      <g transform="translate(26.4 9)">
        <circle cx="0" cy="-2.2" r="1.5" fill="#fde68a" />
        <circle cx="2.1" cy="-0.7" r="1.5" fill="#fde68a" />
        <circle cx="1.3" cy="1.8" r="1.5" fill="#fde68a" />
        <circle cx="-1.3" cy="1.8" r="1.5" fill="#fde68a" />
        <circle cx="-2.1" cy="-0.7" r="1.5" fill="#fde68a" />
        <circle cx="0" cy="0" r="1.2" fill="#f59e0b" />
      </g>
    </>
  ),
  ember: (
    <>
      <Bust skin="#e9b489" cloth="#b91c1c" shade="#8c1515" />
      <path d={CAP} fill="#f97316" />
      <g fill="#f97316">
        <path d="M12.4 11.8c-.5-3.5.8-6.1 3.5-7.7-.7 2.1-.7 4 .1 5.9z" />
        <path d="M17.2 10.6c-.9-4.4.5-7.3 3.5-9.3-.7 2.7-.6 5.1.5 7.4z" />
        <path d="M22.6 9.8c-.4-3.9 1.3-6.6 4.2-7.9-.9 2.4-.9 4.6-.1 6.7z" />
      </g>
      <path d="M21.2 8.4c-.2-2.2.6-3.9 2.1-5-.3 1.5-.2 2.9.4 4.3z" fill="#fb923c" />
      <Face mouth="#b4553f" />
      <g fill="#c26a3f" opacity="0.55">
        <circle cx="15.3" cy="18.7" r="0.42" />
        <circle cx="16.5" cy="19.2" r="0.36" />
        <circle cx="23.5" cy="19.2" r="0.36" />
        <circle cx="24.7" cy="18.7" r="0.42" />
      </g>
    </>
  ),
  shade: (
    <>
      <Bust skin="#d8a274" cloth="#1f2937" shade="#111827" />
      <path d="M10.4 14.6A9.9 9.9 0 0 1 29.6 14.6Q20 15.2 10.4 14.6Z" fill="#1f2937" />
      <path d="M10.4 14.6A9.9 9.9 0 0 1 29.6 14.6" fill="none" stroke="#0b1220" strokeWidth="1.3" />
      <path d="M9.4 14h3.4v9.6a1.7 1.7 0 0 1-3.4 0z" fill="#1f2937" />
      <path d="M27.2 14h3.4v9.6a1.7 1.7 0 0 1-3.4 0z" fill="#1f2937" />
      <Face mouth="#a9605a" />
    </>
  ),
  mochi: (
    <>
      <Bust skin="#fbd8b6" cloth="#7c3aed" shade="#6527c9" />
      <circle cx="12.2" cy="6.8" r="3.5" fill="#f59e0b" />
      <circle cx="27.8" cy="6.8" r="3.5" fill="#f59e0b" />
      <path d={CAP} fill="#f59e0b" />
      <Face mouth="#c06a5f" />
    </>
  ),
  prism: (
    <>
      <Bust skin="#f3c9a6" cloth="#1e3a8a" shade="#152a63" />
      <path d="M10 12.4h4.4v9.4a2.2 2.2 0 0 1-4.4 0z" fill="#38bdf8" />
      <path d="M25.6 12.4H30v9.4a2.2 2.2 0 0 1-4.4 0z" fill="#38bdf8" />
      <path d={CAP} fill="#38bdf8" />
      <Face />
      <path
        d="M25.2 7.6 26.2 10l2.5.3-1.8 1.8.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.8-1.8 2.5-.3z"
        fill="#fde68a"
      />
    </>
  ),
  sprout: (
    <>
      <Bust skin="#c98a5b" cloth="#166534" shade="#0f4a25" />
      <g fill="#4d7c0f">
        <circle cx="13.4" cy="9.6" r="3.2" />
        <circle cx="20" cy="6.4" r="3.6" />
        <circle cx="26.6" cy="9.6" r="3.2" />
        <circle cx="11.4" cy="14" r="2.5" />
        <circle cx="28.6" cy="14" r="2.5" />
      </g>
      <path d={CAP} fill="#4d7c0f" />
      <Face mouth="#a8613f" />
      <path d="M22.6 4c2.6-2.2 5.2-2 6.2-1.7-.4 2.6-1.9 4.6-4.5 5.2z" fill="#86efac" />
    </>
  ),
  static: (
    <>
      <Bust skin="#cbd5e1" cloth="#334155" shade="#1e293b" robot />
      <line x1="20" y1="7.4" x2="20" y2="3.6" stroke="#94a3b8" strokeWidth="1.3" />
      <circle cx="20" cy="2.8" r="1.7" fill="#f472b6" />
      <rect x="11.8" y="7.4" width="16.4" height="16.8" rx="5.2" fill="#cbd5e1" />
      <rect
        x="11.8"
        y="7.4"
        width="16.4"
        height="16.8"
        rx="5.2"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <rect x="9.4" y="13.8" width="2.4" height="4.4" rx="1.2" fill="#94a3b8" />
      <rect x="28.2" y="13.8" width="2.4" height="4.4" rx="1.2" fill="#94a3b8" />
      <rect x="13.8" y="11.8" width="12.4" height="5.4" rx="2.7" fill="#0f172a" />
      <circle cx="16.9" cy="14.5" r="1.2" fill="#22d3ee" />
      <circle cx="23.1" cy="14.5" r="1.2" fill="#22d3ee" />
      <g stroke="#94a3b8" strokeWidth="0.9" strokeLinecap="round">
        <line x1="16.6" y1="19.6" x2="23.4" y2="19.6" />
        <line x1="17.7" y1="21.2" x2="22.3" y2="21.2" />
      </g>
    </>
  ),
  tide: (
    <>
      <Bust skin="#f1c8a6" cloth="#0ea5e9" shade="#0284c7" />
      <path d="M9.8 12.6h4.2v10.6a2.1 2.1 0 0 1-4.2 0z" fill="#0f766e" />
      <path d="M26 12.6h4.2v10.6a2.1 2.1 0 0 1-4.2 0z" fill="#0f766e" />
      <path d={CAP} fill="#0f766e" />
      <Face mouth="#b06a5e" />
      <path
        d="M10.6 16.4v-1.9a9.4 9.4 0 0 1 18.8 0v1.9"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="8.6" y="15" width="3.4" height="6" rx="1.5" fill="#e2e8f0" />
      <rect x="28" y="15" width="3.4" height="6" rx="1.5" fill="#e2e8f0" />
    </>
  ),
};

export const CHARACTER_OPTIONS: { key: CharacterKey; label: string }[] = [
  { key: "comet", label: "Comet" },
  { key: "orbit", label: "Orbit" },
  { key: "petal", label: "Petal" },
  { key: "ember", label: "Ember" },
  { key: "shade", label: "Shade" },
  { key: "mochi", label: "Mochi" },
  { key: "prism", label: "Prism" },
  { key: "sprout", label: "Sprout" },
  { key: "static", label: "Static" },
  { key: "tide", label: "Tide" },
];

export function CharacterArt({ kind, size }: { kind: CharacterKey; size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden focusable="false" className="select-none">
      {CHARACTERS[kind]}
    </svg>
  );
}
