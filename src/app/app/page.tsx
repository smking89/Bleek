import { redirect } from "next/navigation";
import { BleekApp } from "@/components/bleek-app";
import { currentAccount } from "@/lib/session";
import { profileForUser } from "@/lib/astro/account-profile";
import { ensureMember } from "@/lib/store";
import { astroConfigured } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bleek — chat, voice & cosmetics",
};

export default async function AppPage() {
  if (!astroConfigured()) redirect("/astro?next=/app#access");

  let account: Awaited<ReturnType<typeof currentAccount>> = null;
  try {
    account = await currentAccount();
  } catch (error) {
    if (!(error instanceof AstroDataError)) throw error;
  }

  // The client never renders for an anonymous visitor.
  if (!account) redirect("/astro?next=/app#access");

  // Suspended accounts keep their cookie until it expires, so the boundary checks status too.
  if (account.status === "SUSPENDED") redirect("/astro?suspended=1#access");

  const profile = await profileForUser(account.id);

  // The chat rows carry the account, not a stand-in: name, handle, region,
  // platform and wallet balance are read from the account this session owns.
  await ensureMember({
    id: account.id,
    handle: account.handle,
    displayName: account.displayName,
    verified: Boolean(account.handleVerifiedAt),
    region: profile?.region ?? null,
    playPlatform: profile?.platform ?? null,
    coins: account.wallet?.coins ?? 0,
  });

  return (
    <BleekApp
      identity={{
        handle: account.handle,
        displayName: account.displayName,
        verified: Boolean(account.handleVerifiedAt),
        staffRole: account.staffRole,
        region: profile?.region ?? null,
        playPlatform: profile?.platform ?? null,
      }}
    />
  );
}
