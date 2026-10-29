import { createState, providerConfigured, publicOrigin } from "@/lib/astro/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!providerConfigured("XBOX")) {
    return Response.json(
      {
        error: "Xbox sign-in is not configured. Set XBOX_CLIENT_ID and XBOX_CLIENT_SECRET from an Azure app registration.",
        code: "PROVIDER_UNCONFIGURED",
      },
      { status: 503 },
    );
  }

  const origin = publicOrigin(request);
  const params = new URLSearchParams({
    client_id: process.env.XBOX_CLIENT_ID as string,
    response_type: "code",
    redirect_uri: `${origin}/api/astro/auth/xbox/callback`,
    response_mode: "query",
    scope: "openid profile email User.Read offline_access",
    state: createState("XBOX"),
    prompt: "select_account",
  });

  return Response.redirect(`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params.toString()}`, 303);
}
