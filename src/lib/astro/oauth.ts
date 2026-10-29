import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createAstroAccount } from "@astro/core/accounts";
import { astroDb } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";

export type OAuthProvider = "STEAM" | "XBOX";

/**
 * The origin providers must be able to reach us on. Steam and Microsoft both
 * reject loopback callbacks for a registered app, so production sets this.
 */
export function publicOrigin(request: Request): string {
  const configured = process.env.ASTRO_PUBLIC_ORIGIN?.trim().replace(/\/+$/, "");
  return configured || new URL(request.url).origin;
}

export function providerConfigured(provider: OAuthProvider): boolean {
  if (provider === "STEAM") return true;
  return Boolean(process.env.XBOX_CLIENT_ID && process.env.XBOX_CLIENT_SECRET);
}

function stateSecret(): string {
  const secret = process.env.ASTRO_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new AstroDataError("Sign-in is not configured: set ASTRO_AUTH_SECRET.", 503, "AUTH_UNCONFIGURED");
  }
  return secret;
}

/** A signed, timestamped nonce so a callback cannot be replayed from a link. */
export function createState(provider: OAuthProvider): string {
  const payload = `${provider}.${randomBytes(12).toString("base64url")}.${Date.now()}`;
  const signature = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readState(provider: OAuthProvider, state: string | null | undefined): boolean {
  if (!state) return false;
  const parts = state.split(".");
  if (parts.length !== 4) return false;

  const [name, nonce, issued, signature] = parts;
  if (name !== provider) return false;

  const expected = Buffer.from(createHmac("sha256", stateSecret()).update(`${name}.${nonce}.${issued}`).digest("base64url"));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;

  const age = Date.now() - Number(issued);
  return Number.isFinite(age) && age >= 0 && age < 10 * 60 * 1000;
}

function handleFor(provider: OAuthProvider, providerAccountId: string): string {
  const suffix = providerAccountId.replace(/\D/g, "").slice(-12) || randomBytes(5).toString("hex");
  return `${provider.toLowerCase()}.${suffix}`;
}

/**
 * Resolves a provider identity to an ASTRO account, creating one on first
 * sign-in. The generated handle is unique per provider id, and a collision
 * appends a short random tail rather than exposing the provider id twice.
 */
export async function accountForProvider(input: {
  provider: OAuthProvider;
  providerAccountId: string;
  displayName: string;
}): Promise<string> {
  const existing = await astroDb().linkedSignIn.findUnique({
    where: {
      provider_providerAccountId: {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
    },
    select: { userId: true },
  });

  if (existing) {
    await astroDb().linkedSignIn.update({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      data: { lastUsedAt: new Date(), providerHandle: input.displayName },
    });
    return existing.userId;
  }

  const base = handleFor(input.provider, input.providerAccountId);
  const candidates = [base, `${base}.${randomBytes(2).toString("hex")}`];

  let account;
  for (const [index, handle] of candidates.entries()) {
    try {
      account = await createAstroAccount({
        handle,
        displayName: input.displayName,
        headline: input.provider === "STEAM" ? "signed in with Steam" : "signed in with Xbox",
        startingCoins: 250,
      });
      break;
    } catch (error) {
      const duplicate = typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "DUPLICATE";
      if (!duplicate || index === candidates.length - 1) throw error;
    }
  }

  if (!account) throw new AstroDataError("Could not create an account for that identity.", 500, "OAUTH_ACCOUNT_FAILED");

  await astroDb().linkedSignIn.create({
    data: {
      userId: account.id,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      providerHandle: input.displayName,
      lastUsedAt: new Date(),
    },
  });

  return account.id;
}
