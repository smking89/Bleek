/**
 * Sign-up vocabulary shared by the API validators and the access card.
 * Client-safe: no Prisma, no Node built-ins.
 */

export const REGIONS = [
  { value: "NORTH_AMERICA", label: "North America" },
  { value: "EUROPE", label: "Europe" },
  { value: "LATIN_AMERICA", label: "Latin America" },
  { value: "MIDDLE_EAST_AFRICA", label: "Middle East & Africa" },
  { value: "ASIA_PACIFIC", label: "Asia Pacific" },
  { value: "OCEANIA", label: "Oceania" },
] as const;

export type RegionValue = (typeof REGIONS)[number]["value"];

export const PLAY_PLATFORMS = [
  { value: "PC", label: "PC", hint: "Steam, Epic, desktop" },
  { value: "CONSOLE", label: "Console", hint: "Xbox, PlayStation" },
  { value: "BOTH", label: "Both", hint: "I play on both" },
] as const;

export type PlayPlatformValue = (typeof PLAY_PLATFORMS)[number]["value"];

export function isRegion(value: unknown): value is RegionValue {
  return typeof value === "string" && REGIONS.some((region) => region.value === value);
}

export function isPlayPlatform(value: unknown): value is PlayPlatformValue {
  return typeof value === "string" && PLAY_PLATFORMS.some((platform) => platform.value === value);
}

export function regionLabel(value: string): string {
  return REGIONS.find((region) => region.value === value)?.label ?? value;
}

export function playPlatformLabel(value: string): string {
  return PLAY_PLATFORMS.find((platform) => platform.value === value)?.label ?? value;
}
