import { accountForProvider, providerConfigured, publicOrigin, readState } from "@/lib/astro/oauth";
import { startSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type TokenResponse = { access_token?: string; id_token?: string; error_description?: string };
type MicrosoftProfile = { id?: string; displayName?: string; userPrincipalName?: string };

function decodeIdToken(token: string): { sub?: string; name?: string } {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; name?: string };
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  const origin = publicOrigin(request);
  const url = new URL(request.url);

  if (!providerConfigured("XBOX")) {
    return Response.redirect(`${origin}/astro?authError=xbox_unconfigured#access`, 303);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !readState("XBOX", state)) {
    return Response.redirect(`${origin}/astro?authError=xbox_cancelled#access`, 303);
  }

  try {
    const tokenResponse = await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.XBOX_CLIENT_ID as string,
        client_secret: process.env.XBOX_CLIENT_SECRET as string,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${origin}/api/astro/auth/xbox/callback`,
        scope: "openid profile email User.Read offline_access",
      }).toString(),
      cache: "no-store",
    });

    const tokens = (await tokenResponse.json()) as TokenResponse;
    if (!tokenResponse.ok || !tokens.access_token) {
      return Response.redirect(`${origin}/astro?authError=xbox_failed#access`, 303);
    }

    const graph = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    const profile = graph.ok ? ((await graph.json()) as MicrosoftProfile) : {};
    const fromToken = tokens.id_token ? decodeIdToken(tokens.id_token) : {};
    const providerAccountId = profile.id ?? fromToken.sub;

    if (!providerAccountId) return Response.redirect(`${origin}/astro?authError=xbox_failed#access`, 303);

    const displayName =
      profile.displayName?.slice(0, 40) ??
      fromToken.name?.slice(0, 40) ??
      profile.userPrincipalName?.split("@")[0]?.slice(0, 40) ??
      "Xbox player";

    const userId = await accountForProvider({ provider: "XBOX", providerAccountId, displayName });
    await startSession(userId);
    return Response.redirect(`${origin}/app`, 303);
  } catch {
    return Response.redirect(`${origin}/astro?authError=xbox_failed#access`, 303);
  }
}
