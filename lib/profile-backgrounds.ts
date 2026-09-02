export const PREMIUM_BACKGROUND_PREFIX = "preset:";
export const BACKGROUND_IMAGE_PREFIX = "image:";
export const BACKGROUND_IMAGE_BUCKET = "backgrounds";

export const premiumBackgrounds = [
  { id: "neon-cut", name: "Neon Cut", position: "0% 0%", dark: true },
  { id: "violet-flow", name: "Violet Flow", position: "33.333% 0%", dark: true },
  { id: "purple-edge", name: "Purple Edge", position: "66.667% 0%", dark: true },
  { id: "gold-wave", name: "Gold Wave", position: "100% 0%", dark: true },
  { id: "midnight-silk", name: "Midnight Silk", position: "0% 100%", dark: true },
  { id: "violet-stone", name: "Violet Stone", position: "33.333% 100%", dark: true },
  { id: "ivory-gold", name: "Ivory Gold", position: "66.667% 100%", dark: false },
  { id: "soft-lavender", name: "Soft Lavender", position: "100% 100%", dark: false },
  { id: "fuchsia-ribbon", name: "Fuchsia Ribbon", asset: "/backgrounds/fuchsia-ribbon.png", dark: true },
  { id: "purple-silk", name: "Purple Silk", asset: "/backgrounds/purple-silk.png", dark: true },
  { id: "black-gold-marble", name: "Black Gold", asset: "/backgrounds/black-gold-marble.png", dark: true },
  { id: "rose-gold-flow", name: "Rose Gold", asset: "/backgrounds/rose-gold-flow.png", dark: false },
  { id: "pink-marble", name: "Pink Marble", asset: "/backgrounds/pink-marble.png", dark: false },
  { id: "ivory-gold-flow", name: "Ivory Gold Flow", asset: "/backgrounds/ivory-gold-flow.png", dark: false },
  { id: "lavender-silk", name: "Lavender Silk", asset: "/backgrounds/lavender-silk.png", dark: false },
  { id: "blush-veil", name: "Blush Veil", asset: "/backgrounds/blush-veil.png", dark: false, free: true },

  // Elegant line — pure CSS gradients, no image assets. Fashion / beauty /
  // lifestyle feel: refined, not "girly".
  { id: "rose-noir", name: "Rose Noir", gradient: "linear-gradient(160deg,#2b1721 0%,#4a2333 52%,#180d13 100%)", dark: true },
  { id: "burgundy-velvet", name: "Burgundy Velvet", gradient: "linear-gradient(155deg,#2a0f18 0%,#5c1f2e 50%,#1b0a11 100%)", dark: true },
  { id: "wine-dusk", name: "Wine Dusk", gradient: "linear-gradient(150deg,#33141d 0%,#7a2438 48%,#221019 100%)", dark: true },
  { id: "mauve-smoke", name: "Mauve Smoke", gradient: "linear-gradient(165deg,#342634 0%,#6b5570 58%,#241b28 100%)", dark: true },
  { id: "champagne", name: "Champagne", gradient: "linear-gradient(165deg,#f7efe1 0%,#e9d5bd 55%,#f4e8d6 100%)", dark: false, free: true },
  { id: "pearl-rose", name: "Pearl Rose", gradient: "linear-gradient(160deg,#f8eef1 0%,#ecdae1 55%,#f5eaef 100%)", dark: false },
  { id: "nude-silk", name: "Nude Silk", gradient: "linear-gradient(165deg,#efe3d9 0%,#ddc6b6 55%,#ece1d7 100%)", dark: false },
  { id: "soft-violet", name: "Soft Violet", gradient: "linear-gradient(160deg,#efe9f6 0%,#d9cdec 55%,#ece5f5 100%)", dark: false, free: true },
] as const;

export type PremiumBackgroundId = (typeof premiumBackgrounds)[number]["id"];

const LIGHT_PROFILE_TEXT = "#ffffff";
const DARK_PROFILE_TEXT = "#151515";
const MINIMUM_TEXT_CONTRAST = 4.5;

function hexToRgb(color: string) {
  const normalized = color.trim().replace(/^#/, "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => character.repeat(2)).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;

  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

export function relativeLuminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return null;

  const linearize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linearize(rgb.red)
    + 0.7152 * linearize(rgb.green)
    + 0.0722 * linearize(rgb.blue);
}

export function contrastRatio(firstColor: string, secondColor: string) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  if (first === null || second === null) return 1;

  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function accessibleProfileTextColor(backgroundColor?: string) {
  const background = backgroundColor || "#c9ff58";
  const lightContrast = contrastRatio(background, LIGHT_PROFILE_TEXT);
  const darkContrast = contrastRatio(background, DARK_PROFILE_TEXT);

  if (lightContrast >= darkContrast && lightContrast >= MINIMUM_TEXT_CONTRAST) {
    return LIGHT_PROFILE_TEXT;
  }
  if (darkContrast >= MINIMUM_TEXT_CONTRAST) return DARK_PROFILE_TEXT;

  const blackContrast = contrastRatio(background, "#000000");
  return lightContrast >= blackContrast ? LIGHT_PROFILE_TEXT : "#000000";
}

export function getPremiumBackground(id?: string) {
  return premiumBackgrounds.find(background => background.id === id);
}

export function isFreeBackground(id?: string) {
  const background = getPremiumBackground(id);
  return Boolean(background && "free" in background);
}

export function decodeStoredBackground(value?: string) {
  if (value?.startsWith(BACKGROUND_IMAGE_PREFIX)) {
    const imagePath = value.slice(BACKGROUND_IMAGE_PREFIX.length);
    if (imagePath) return { color: "#0f1115", preset: undefined, imagePath };
  }
  if (value?.startsWith(PREMIUM_BACKGROUND_PREFIX)) {
    const preset = value.slice(PREMIUM_BACKGROUND_PREFIX.length);
    if (getPremiumBackground(preset)) return { color: "#0f1115", preset, imagePath: undefined };
  }
  return { color: value || "#c9ff58", preset: undefined, imagePath: undefined };
}

export function encodeStoredBackground(color?: string, preset?: string, imagePath?: string) {
  if (imagePath) return `${BACKGROUND_IMAGE_PREFIX}${imagePath}`;
  return preset ? `${PREMIUM_BACKGROUND_PREFIX}${preset}` : color || "#c9ff58";
}

// Accepts only "<uid>/<file>" segments so a stored value cannot smuggle a URL,
// a path traversal, or another user's folder into an image style. Used for both
// the background image and the cover image (same 'backgrounds' bucket).
export function isValidBackgroundImagePath(path?: string | null): path is string {
  return typeof path === "string" && /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/i.test(path);
}

export function backgroundImageStyle(url?: string) {
  if (!url) return undefined;
  return {
    backgroundImage: `url('${encodeURI(url)}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  } as const;
}

export function premiumBackgroundStyle(id?: string) {
  const background = getPremiumBackground(id);
  if (!background) return undefined;
  if ("gradient" in background) {
    return { backgroundImage: background.gradient } as const;
  }
  if ("asset" in background) {
    return {
      backgroundImage: `url('${background.asset}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    } as const;
  }
  return {
    backgroundImage: "url('/backgrounds/premium-collection.webp')",
    backgroundSize: "400% 200%",
    backgroundPosition: background.position,
    backgroundRepeat: "no-repeat",
  } as const;
}
