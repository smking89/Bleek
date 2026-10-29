/** Cyan verification check shown beside a handle that staff have verified. */
export function VerifiedBadge({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center text-[#06B6D4] ${className}`} title="Verified ASTRO handle">
      <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Verified handle" fill="currentColor">
        <path d="M12 1.6l2.6 2 3.2-.2.9 3.1 2.7 1.8-1.3 3 1.3 3-2.7 1.8-.9 3.1-3.2-.2-2.6 2-2.6-2-3.2.2-.9-3.1L2.6 14.9l1.3-3-1.3-3 2.7-1.8.9-3.1 3.2.2z" />
        <path
          d="M8.4 12.2l2.4 2.4 4.8-4.9"
          fill="none"
          stroke="#000"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Quiet marker for the signed-in account before staff verify its handle. */
export function UnverifiedTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="A staff member can verify this handle"
      className={`inline-flex shrink-0 items-center rounded-full border border-white/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8] ${className}`}
    >
      Unverified
    </span>
  );
}
