/**
 * Creates the ASTRO demo accounts: a player, a business account and one of each
 * staff role, plus the profile the /astro preview reads.
 *
 *   npm run seed:accounts
 *   ASTRO_DEMO_PASSWORD="something-else" npm run seed:accounts
 *
 * Re-running is safe: existing handles keep their account, wallet and ASTROid,
 * and are brought back to the documented role, verification and chips. The
 * password is only set when an account is first created.
 */
import { readFileSync } from "node:fs";
import { astroDb } from "@astro/core/db";
import { connectPlatform, createAstroAccount, getAstroAccount } from "@astro/core/accounts";
import { hashPassword } from "@astro/core/auth";
import { AstroDataError } from "@astro/core/errors";
import type { PlatformType } from "@astro/core/links";

// Next.js loads .env for the app; a plain Node process does not.
if (!process.env.DATABASE_URL) {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || line.trim().startsWith("#")) continue;
      const [, key, rawValue] = match;
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // No .env file: DATABASE_URL must already be in the environment.
  }
}

const PASSWORD = process.env.ASTRO_DEMO_PASSWORD ?? "astro-demo-1234";

type StaffRoleName = "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

type DemoAccount = {
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  accentColor: string;
  coins: number;
  staffRole: StaffRoleName | null;
  staffTitle: string | null;
  connections: { platform: PlatformType; handle: string }[];
};

const ACCOUNTS: DemoAccount[] = [
  {
    handle: "player",
    displayName: "Player One",
    headline: "just here to play",
    bio: "Picks up quests in Koba.games, drops clips in SnagChat.",
    accentColor: "#06b6d4",
    coins: 1200,
    staffRole: null,
    staffTitle: null,
    connections: [
      { platform: "BEEK", handle: "player" },
      { platform: "KOBA_GAMES", handle: "player.gg" },
    ],
  },
  {
    handle: "business",
    displayName: "Koba Studio",
    headline: "creator studio · games & drops",
    bio: "Sells cosmetics through creator storefronts and pays out 90% to the artists we sign.",
    accentColor: "#f0b232",
    coins: 4800,
    staffRole: null,
    staffTitle: null,
    connections: [
      { platform: "BEEK", handle: "koba.studio" },
      { platform: "KOBA_GAMES", handle: "kobastudio" },
      { platform: "SNAGCHAT", handle: "koba.studio" },
      { platform: "KOBABOT", handle: "123456789012345678" },
    ],
  },
  {
    handle: "moderator",
    displayName: "Rin Voss",
    headline: "moderation",
    bio: "Triage reports, suspend the obvious scams and keep the audit trail clean.",
    accentColor: "#94a3b8",
    coins: 900,
    staffRole: "MODERATOR",
    staffTitle: "Moderator",
    connections: [{ platform: "BEEK", handle: "rin" }],
  },
  {
    handle: "admin",
    displayName: "Kai Mercer",
    headline: "operations",
    bio: "Wallets, staff roles and developer apps for the ASTRO products.",
    accentColor: "#4f46e5",
    coins: 2400,
    staffRole: "ADMIN",
    staffTitle: "Admin",
    connections: [{ platform: "BEEK", handle: "kai" }],
  },
  {
    handle: "superadmin",
    displayName: "Nova",
    headline: "platform owner",
    bio: "Unrestricted access, including who wears a staff badge.",
    accentColor: "#22d3ee",
    coins: 9000,
    staffRole: "SUPER_ADMIN",
    staffTitle: "Super admin",
    connections: [
      { platform: "BEEK", handle: "nova" },
      { platform: "KOBABOT", handle: "987654321098765432" },
    ],
  },
  {
    handle: "koba",
    displayName: "Koba",
    headline: "building small games",
    bio: "The account the /astro profile preview reads, with one chip per product.",
    accentColor: "#a855f7",
    coins: 250,
    staffRole: null,
    staffTitle: null,
    connections: [
      { platform: "BEEK", handle: "koba" },
      { platform: "KOBA_GAMES", handle: "koba.games" },
      { platform: "SNAGCHAT", handle: "koba.reels" },
      { platform: "KOBABOT", handle: "112233445566778899" },
    ],
  },
];

async function seedAccount(seed: DemoAccount) {
  let account;
  try {
    account = await getAstroAccount(seed.handle);
  } catch (error) {
    if (!(error instanceof AstroDataError) || error.code !== "ACCOUNT_NOT_FOUND") throw error;
  }

  if (!account) {
    account = await createAstroAccount({
      handle: seed.handle,
      displayName: seed.displayName,
      headline: seed.headline,
      bio: seed.bio,
      accentColor: seed.accentColor,
      passwordHash: await hashPassword(PASSWORD),
      startingCoins: seed.coins,
    });
    console.log(`  created @${seed.handle}`);
  } else {
    console.log(`  kept    @${seed.handle} (existing account, password unchanged)`);
  }

  await astroDb().user.update({
    where: { id: account.id },
    data: {
      staffRole: seed.staffRole,
      staffTitle: seed.staffTitle,
      staffSince: seed.staffRole ? (account.staffSince ?? new Date()) : null,
      handleVerifiedAt: account.handleVerifiedAt ?? new Date(),
    },
  });

  for (const connection of seed.connections) {
    try {
      await connectPlatform(seed.handle, connection.platform, connection.handle);
    } catch (error) {
      if (error instanceof AstroDataError && (error.code === "CONNECTION_TAKEN" || error.code === "DUPLICATE")) continue;
      throw error;
    }
  }

  return getAstroAccount(seed.handle);
}

async function main() {
  console.log("Seeding ASTRO demo accounts…");
  const rows = [];
  for (const seed of ACCOUNTS) rows.push(await seedAccount(seed));

  console.log("\n  handle      role         coins   astroid");
  console.log("  ──────────  ───────────  ──────  ───────────────────────────────────");
  for (const row of rows) {
    const role = row.staffRole ? row.staffTitle ?? row.staffRole : "member";
    console.log(
      `  @${row.handle.padEnd(10)}  ${role.padEnd(11)}  ${String(row.wallet?.coins ?? 0).padStart(6)}  ${row.astroId ?? "—"}`,
    );
  }
  console.log(`\nPassword for every seeded account: ${PASSWORD}`);
  console.log("Sign in at /#access, or open /app directly once signed in.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => astroDb().$disconnect());
