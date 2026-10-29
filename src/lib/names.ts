/**
 * Reserved-name gate.
 *
 * Server names, channel names, role labels, cosmetic names and display names are
 * all free text, so a name that trades on another company's brand — or claims to
 * be the platform itself — is rejected before it reaches the database.
 */

const THIRD_PARTY_BRANDS = [
  "discord",
  "slack",
  "telegram",
  "signal",
  "element",
  "matrix",
  "mattermost",
  "revolt",
  "guilded",
  "meta",
  "facebook",
  "instagram",
  "whatsapp",
  "threads",
  "messenger",
  "snapchat",
  "tiktok",
  "twitter",
  "reddit",
  "tumblr",
  "linkedin",
  "pinterest",
  "youtube",
  "twitch",
  "spotify",
  "netflix",
  "steam",
  "valve",
  "xbox",
  "microsoft",
  "playstation",
  "sony",
  "nintendo",
  "roblox",
  "minecraft",
  "fortnite",
  "epic games",
  "google",
  "apple",
  "amazon",
  "openai",
  "chatgpt",
  "patreon",
  "stripe",
  "paypal",
] as const;

const OWN_BRANDS = ["astro", "bleek", "koba", "kobabot", "snagchat"] as const;

const OFFICIAL_CLAIMS = ["official", "verified", "support", "staff", "admin", "team", "mod", "moderator"] as const;

/** Lowercase, punctuation collapsed to spaces, wrapped so words can be matched whole. */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** The reason a name is refused, or null when it is fine. */
export function nameViolation(name: string): string | null {
  const words = normalise(name);
  if (!words) return null;

  const padded = ` ${words} `;

  for (const brand of THIRD_PARTY_BRANDS) {
    if (padded.includes(` ${brand} `)) {
      return `“${name.trim()}” uses another company's brand. Pick a name of your own.`;
    }
  }

  const claims = OFFICIAL_CLAIMS.some((claim) => padded.includes(` ${claim} `));
  const impersonates = OWN_BRANDS.some((brand) => padded.includes(` ${brand} `));
  if (claims && impersonates) {
    return `“${name.trim()}” reads as an official account. Pick a name of your own.`;
  }

  return null;
}
