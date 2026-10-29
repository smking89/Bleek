import { publicOrigin } from "@/lib/astro/oauth";

export const dynamic = "force-dynamic";

/** Steam uses OpenID 2.0: no client secret, only a realm the callback returns to. */
export async function GET(request: Request) {
  const origin = publicOrigin(request);
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${origin}/api/astro/auth/steam/callback`,
    "openid.realm": origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return Response.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`, 303);
}
