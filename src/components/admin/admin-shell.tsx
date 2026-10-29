"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { ROLE_META, can, capabilitiesFor, type Capability, type StaffRole } from "@/lib/admin/roles";

const NAV: { href: string; label: string; icon: IconName; capability: Capability }[] = [
  { href: "/admin", label: "Overview", icon: "activity", capability: "admin.view" },
  { href: "/admin/users", label: "Members", icon: "users", capability: "users.read" },
  { href: "/admin/moderation", label: "Moderation", icon: "flag", capability: "cases.read" },
  { href: "/admin/developers", label: "Developers", icon: "key", capability: "dev.read" },
  { href: "/admin/staff", label: "Staff", icon: "shield", capability: "staff.manage" },
  { href: "/admin/audit", label: "Audit log", icon: "terminal", capability: "audit.read" },
];

export function AdminShell({
  handle,
  displayName,
  role,
  children,
}: {
  handle: string;
  displayName: string;
  role: StaffRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const meta = ROLE_META[role];
  const items = NAV.filter((item) => can(role, item.capability));

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/astro/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-[#FAFAFA] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-white/[0.06] bg-[#121214] px-3 py-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/astro-icon.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FAFAFA]">ASTRO</span>
            <span className="block text-[10px] text-[#8A8A94]">Operations</span>
          </span>
        </Link>

        <div className={`mt-4 rounded-lg border px-3 py-2.5 ${meta.tone}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{meta.label}</p>
          <p className="mt-1 truncate text-[12px] font-medium text-[#FAFAFA]">@{handle}</p>
          <p className="mt-1 text-[10px] leading-4 text-[#A1A1AA]">
            {capabilitiesFor(role).length} capabilities
          </p>
        </div>

        <nav aria-label="Console sections" className="mt-4 flex flex-col gap-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[#7C3AED]/15 text-[#FAFAFA]"
                  : "text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#FAFAFA]"
              }`}
            >
              <Icon name={item.icon} size={16} className={isActive(item.href) ? "text-[#C4B5FD]" : ""} />
              {item.label}
              {isActive(item.href) ? (
                <span className="ml-auto h-4 w-[2px] rounded-full bg-[#7C3AED]" aria-hidden />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/[0.06] pt-3">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
          >
            <Icon name="hash" size={15} /> Open Bleek
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#8A8A94] transition-colors hover:text-[#FCA5A5] disabled:opacity-50"
          >
            <span aria-hidden>⏻</span> {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-black/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/astro-icon.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">ASTRO</span>
            </Link>

            <p className="hidden text-[12px] text-[#A1A1AA] lg:block">
              Operations console ·{" "}
              <span className={meta.tone.split(" ").pop()}>{meta.label}</span>
            </p>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-[12px] text-[#A1A1AA] sm:block">
                {displayName} <span className="text-[#8A8A94]">@{handle}</span>
              </span>
              <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline ${meta.tone}`}>
                {meta.badge}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-md px-2 py-1 text-[11px] text-[#8A8A94] transition-colors hover:text-[#FCA5A5] lg:hidden"
              >
                Sign out
              </button>
            </div>
          </div>

          <nav aria-label="Console sections" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-[#FAFAFA]"
                    : "border-white/10 text-[#A1A1AA]"
                }`}
              >
                <Icon name={item.icon} size={13} />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  );
}
