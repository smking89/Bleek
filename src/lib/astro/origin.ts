import "server-only";

import { headers } from "next/headers";

/** 0.0.0.0 is a bind address, not somewhere a browser can go. */
function usable(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.hostname === "0.0.0.0" || url.hostname === "::" || url.hostname === "[::]") {
      url.hostname = "localhost";
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Origins this deployment answers on, so the sign-in page can recognise its own
 * pages as first-party. `APP_ORIGIN` is authoritative because a proxy can
 * rewrite Host; the incoming host is included too, which keeps preview and
 * development hostnames working without extra configuration.
 */
export async function deploymentOrigins(): Promise<string[]> {
  const origins = new Set<string>();

  for (const configured of [process.env.APP_ORIGIN, process.env.NEXT_PUBLIC_APP_URL]) {
    const origin = configured?.trim() ? usable(configured.trim()) : null;
    if (origin) origins.add(origin);
  }

  const incoming = await headers().catch(() => null);
  const host = (incoming?.get("x-forwarded-host") ?? incoming?.get("host"))?.split(",")[0]?.trim();
  if (host) {
    // A loopback host is plain http even in a production build run locally.
    const loopback = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    const forwarded = incoming?.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto = forwarded ?? (loopback ? "http" : process.env.NODE_ENV === "production" ? "https" : "http");
    const origin = usable(`${proto}://${host}`);
    if (origin) origins.add(origin);
  }

  return [...origins];
}
