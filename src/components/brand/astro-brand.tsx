/**
 * ASTRO brand assets.
 *
 * The guidelines page renders these components, and integrators copy the same
 * markup, so the shipped button and the documented button cannot drift: the
 * class strings below are the single source for both.
 */

export const ASTRO_ICON = "/astro-icon.png";
export const ASTRO_MARK_RED = "/brand/astro-mark-red.png";
export const ASTRO_MARK_WHITE = "/brand/astro-mark-white.png";
export const ASTRO_MARK_BLACK = "/brand/astro-mark-black.png";

/** The only approved label. Never "Login with ASTRO" or "Continue with ASTRO". */
export const ASTRO_SIGNIN_LABEL = "Sign in with ASTRO";

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg font-semibold ring-1 ring-inset transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4]";

const BUTTON_SURFACE = {
  /** On Space Black and Abyss Charcoal: a Static White fill. */
  dark: "bg-[#F8FAFC] text-black ring-black/10 hover:bg-[#E2E8F0]",
  /** On Static White: a Space Black fill. */
  light: "bg-black text-[#F8FAFC] ring-white/10 hover:bg-[#111318]",
} as const;

const BUTTON_SIZE = {
  md: { box: "h-10 gap-2.5 px-4 text-[13px]", mark: 18, markBox: "h-[18px] w-[18px]" },
  sm: { box: "h-8 gap-2 px-3 text-[12px]", mark: 15, markBox: "h-[15px] w-[15px]" },
} as const;

export type AstroSignInSurface = keyof typeof BUTTON_SURFACE;
export type AstroSignInSize = keyof typeof BUTTON_SIZE;

export function AstroMark({
  src = ASTRO_ICON,
  size = 24,
  className = "",
}: {
  src?: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

/** Horizontal lockup: mark at 26px, 12px gap, then the wordmark. */
export function AstroLockup({
  markSize = 26,
  src = ASTRO_ICON,
  className = "",
}: {
  markSize?: number;
  src?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <AstroMark src={src} size={markSize} />
      <span className="text-[13px] font-bold uppercase tracking-[0.22em] text-[#F8FAFC]">ASTRO</span>
    </span>
  );
}

export function AstroSignInButton({
  href = "/astro",
  surface = "dark",
  size = "md",
  disabled = false,
  className = "",
}: {
  href?: string;
  surface?: AstroSignInSurface;
  size?: AstroSignInSize;
  disabled?: boolean;
  className?: string;
}) {
  const { box, mark, markBox } = BUTTON_SIZE[size];
  const classes = `${BUTTON_BASE} ${BUTTON_SURFACE[surface]} ${box} ${disabled ? "pointer-events-none opacity-40" : ""} ${className}`;

  const inner = (
    <>
      <AstroMark src={ASTRO_MARK_RED} className={markBox} size={mark} />
      {ASTRO_SIGNIN_LABEL}
    </>
  );

  // A disabled control is not a link, so it must not be focusable or navigable.
  if (disabled) {
    return (
      <span aria-disabled="true" className={classes}>
        {inner}
      </span>
    );
  }

  return (
    <a href={href} className={classes}>
      {inner}
    </a>
  );
}

/**
 * The same control as copy-paste HTML, generated from the constants above.
 * Keep it identical to `AstroSignInButton`'s light-on-dark, medium variant.
 */
export const ASTRO_SIGNIN_HTML = [
  `<a href="/astro" class="${BUTTON_BASE} ${BUTTON_SURFACE.dark} ${BUTTON_SIZE.md.box}">`,
  `  <img src="${ASTRO_MARK_RED}" alt="" width="${BUTTON_SIZE.md.mark}" height="${BUTTON_SIZE.md.mark}" class="${BUTTON_SIZE.md.markBox} object-contain" />`,
  `  ${ASTRO_SIGNIN_LABEL}`,
  `</a>`,
].join("\n");

/**
 * The mark as a flat, single-colour vector.
 *
 * It fills with `currentColor`, so a product tints it by setting a text colour
 * and nothing else. There is deliberately no gradient, pattern, texture or inner
 * detail: the shape is the whole mark, which is what keeps it legible at 12px in
 * a balance chip and identical at 512px.
 */
export function AstroGlyph({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={`shrink-0 ${className}`}
    >
      <path d="M13.55 1.7 1.15 30.3h6.35c1.5 0 2.55-1.02 2.95-2.45l3.95-13.1c.25-.85 1.35-.84 1.6 0l4 13.1c.4 1.43 1.45 2.45 2.95 2.45h6.35L18.45 1.7c-1.2-2.27-3.7-2.27-4.9 0Z" />
    </svg>
  );
}
