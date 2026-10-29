import Link from "next/link";

export function DevHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/astro" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/astro-icon.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F8FAFC]">ASTRO</span>
          <span className="hidden text-[10px] uppercase tracking-[0.16em] text-[#6E7C93] sm:inline">Developers</span>
        </Link>

        <nav aria-label="Developer portal" className="flex items-center gap-1 text-[12px]">
          <Link
            href="/developers"
            className="rounded-md px-2.5 py-1.5 text-[#94A3B8] transition-colors hover:text-[#F8FAFC]"
          >
            Overview
          </Link>
          <Link
            href="/developers/docs"
            className="rounded-md px-2.5 py-1.5 text-[#94A3B8] transition-colors hover:text-[#F8FAFC]"
          >
            Docs
          </Link>
          <Link
            href="/developers/console"
            className="rounded-full bg-[#4F46E5] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#4338CA]"
          >
            Console
          </Link>
        </nav>
      </div>
    </header>
  );
}
