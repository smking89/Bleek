import { redirect } from "next/navigation";
import { DiscordApp } from "@/components/discord-app";
import { currentAccount } from "@/lib/astro/auth";
import { astroConfigured } from "@/lib/astro/db";
import { AstroDataError } from "@/lib/astro/errors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bleek — chat, voice & cosmetics",
};

export default async function AppPage() {
  if (!astroConfigured()) redirect("/?next=/app#access");

  let account: Awaited<ReturnType<typeof currentAccount>> = null;
  try {
    account = await currentAccount();
  } catch (error) {
    if (!(error instanceof AstroDataError)) throw error;
  }

  // The client never renders for an anonymous visitor.
  if (!account) redirect("/?next=/app#access");

  // Suspended accounts keep their cookie until it expires, so the boundary checks status too.
  if (account.status === "SUSPENDED") redirect("/?suspended=1#access");

  return (
    <DiscordApp
      identity={{
        handle: account.handle,
        displayName: account.displayName,
        verified: Boolean(account.handleVerifiedAt),
        staffRole: account.staffRole,
      }}
    />
  );
}
