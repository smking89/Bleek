import { accountForProvider, publicOrigin } from "@/lib/astro/oauth";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

async function steamPersona(steamId: string): Promise<string> {
  const key = process.env.STEAM_API_KEY;
  if (!key) return `Steam ${steamId.slice(-6)}`;

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(key)}&steamids=${steamId}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as { response?: { players?: { personaname?: string }[] } };
    return data.response?.players?.[0]?.personaname?.slice(0, 40) || `Steam ${steamId.slice(-6)}`;
  } catch {
    return `Steam ${steamId.slice(-6)}`;
  }
}

export async function GET(request: Request) {
  const origin = publicOrigin(request);
  const url = new URL(request.url);
  const claimed = url.searchParams.get("openid.claimed_id");

  if (!claimed) return Response.redirect(`${origin}/astro?authError=steam_cancelled#access`, 303);

  // Steam only trusts a callback that is echoed back to it, unmodified.
  const assertion = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key.startsWith("openid.")) assertion.append(key, value);
  }
  assertion.set("openid.mode", "check_authentication");

  try {
    const verification = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: assertion.toString(),
      cache: "no-store",
    });
    const text = await verification.text();
    if (!/is_valid\s*:\s*true/.test(text)) {
      return Response.redirect(`${origin}/astro?authError=steam_failed#access`, 303);
    }

    const steamId = /\/id\/(\d{17})$/.exec(claimed)?.[1];
    if (!steamId) return Response.redirect(`${origin}/astro?authError=steam_failed#access`, 303);

    const userId = await accountForProvider({
      provider: "STEAM",
      providerAccountId: steamId,
      displayName: await steamPersona(steamId),
    });

    await startSession(userId);
    return Response.redirect(`${origin}/app`, 303);
  } catch {
    return Response.redirect(`${origin}/astro?authError=steam_failed#access`, 303);
  }
}
