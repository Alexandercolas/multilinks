export const PREMIUM_BACKGROUND_PREFIX = "preset:";

export const premiumBackgrounds = [
  { id: "neon-cut", name: "Neon Cut", position: "0% 0%", dark: true },
  { id: "violet-flow", name: "Violet Flow", position: "33.333% 0%", dark: true },
  { id: "purple-edge", name: "Purple Edge", position: "66.667% 0%", dark: true },
  { id: "gold-wave", name: "Gold Wave", position: "100% 0%", dark: true },
  { id: "midnight-silk", name: "Midnight Silk", position: "0% 100%", dark: true },
  { id: "violet-stone", name: "Violet Stone", position: "33.333% 100%", dark: true },
  { id: "ivory-gold", name: "Ivory Gold", position: "66.667% 100%", dark: false },
  { id: "soft-lavender", name: "Soft Lavender", position: "100% 100%", dark: false },
] as const;

export type PremiumBackgroundId = (typeof premiumBackgrounds)[number]["id"];

export function getPremiumBackground(id?: string) {
  return premiumBackgrounds.find(background => background.id === id);
}

export function decodeStoredBackground(value?: string) {
  if (value?.startsWith(PREMIUM_BACKGROUND_PREFIX)) {
    const preset = value.slice(PREMIUM_BACKGROUND_PREFIX.length);
    if (getPremiumBackground(preset)) return { color: "#0f1115", preset };
  }
  return { color: value || "#c9ff58", preset: undefined };
}

export function encodeStoredBackground(color?: string, preset?: string) {
  return preset ? `${PREMIUM_BACKGROUND_PREFIX}${preset}` : color || "#c9ff58";
}

export function premiumBackgroundStyle(id?: string) {
  const background = getPremiumBackground(id);
  if (!background) return undefined;
  return {
    backgroundImage: "url('/backgrounds/premium-collection.webp')",
    backgroundSize: "400% 200%",
    backgroundPosition: background.position,
    backgroundRepeat: "no-repeat",
  } as const;
}
