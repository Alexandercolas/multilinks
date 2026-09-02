// Central place to recognise a link's platform and its brand identity.
// Everything is derived from the URL host — no network calls. Add a new
// platform by extending PLATFORMS + HOST_MATCHERS; nothing else changes.

export type PlatformId =
  | "youtube"
  | "spotify"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "github"
  | "twitch"
  | "discord"
  | "telegram"
  | "whatsapp"
  | "pinterest"
  | "behance"
  | "dribbble"
  | "applemusic"
  | "soundcloud"
  | "threads";

export type Platform = {
  id: PlatformId;
  label: string;
  /** simpleicons.org slug — served from the CSP-allowed cdn.simpleicons.org */
  slug: string;
  /** brand colour, used for subtle tints */
  color: string;
};

const PLATFORMS: Record<PlatformId, Platform> = {
  youtube: { id: "youtube", label: "YouTube", slug: "youtube", color: "#FF0000" },
  spotify: { id: "spotify", label: "Spotify", slug: "spotify", color: "#1DB954" },
  tiktok: { id: "tiktok", label: "TikTok", slug: "tiktok", color: "#EE1D52" },
  instagram: { id: "instagram", label: "Instagram", slug: "instagram", color: "#E4405F" },
  facebook: { id: "facebook", label: "Facebook", slug: "facebook", color: "#1877F2" },
  twitter: { id: "twitter", label: "X", slug: "x", color: "#111111" },
  linkedin: { id: "linkedin", label: "LinkedIn", slug: "linkedin", color: "#0A66C2" },
  github: { id: "github", label: "GitHub", slug: "github", color: "#111111" },
  twitch: { id: "twitch", label: "Twitch", slug: "twitch", color: "#9146FF" },
  discord: { id: "discord", label: "Discord", slug: "discord", color: "#5865F2" },
  telegram: { id: "telegram", label: "Telegram", slug: "telegram", color: "#26A5E4" },
  whatsapp: { id: "whatsapp", label: "WhatsApp", slug: "whatsapp", color: "#25D366" },
  pinterest: { id: "pinterest", label: "Pinterest", slug: "pinterest", color: "#BD081C" },
  behance: { id: "behance", label: "Behance", slug: "behance", color: "#1769FF" },
  dribbble: { id: "dribbble", label: "Dribbble", slug: "dribbble", color: "#EA4C89" },
  applemusic: { id: "applemusic", label: "Apple Music", slug: "applemusic", color: "#FA243C" },
  soundcloud: { id: "soundcloud", label: "SoundCloud", slug: "soundcloud", color: "#FF5500" },
  threads: { id: "threads", label: "Threads", slug: "threads", color: "#111111" },
};

const HOST_MATCHERS: [RegExp, PlatformId][] = [
  [/(^|\.)youtube(-nocookie)?\.com$/, "youtube"],
  [/(^|\.)youtu\.be$/, "youtube"],
  [/(^|\.)spotify\.com$/, "spotify"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook|fb)\.com$/, "facebook"],
  [/(^|\.)(twitter|x)\.com$/, "twitter"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)github\.(com|io)$/, "github"],
  [/(^|\.)twitch\.tv$/, "twitch"],
  [/(^|\.)discord\.(com|gg)$/, "discord"],
  [/(^|\.)t\.me$/, "telegram"],
  [/(^|\.)telegram\.(me|org)$/, "telegram"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"],
  [/(^|\.)pinterest\.[a-z.]+$/, "pinterest"],
  [/(^|\.)behance\.net$/, "behance"],
  [/(^|\.)dribbble\.com$/, "dribbble"],
  [/(^|\.)music\.apple\.com$/, "applemusic"],
  [/(^|\.)soundcloud\.com$/, "soundcloud"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
];

export function detectPlatform(url: string): Platform | null {
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  for (const [matcher, id] of HOST_MATCHERS) {
    if (matcher.test(host)) return PLATFORMS[id];
  }
  return null;
}

export function platformIconUrl(platform: Platform, color?: string) {
  const suffix = color ? `/${color.replace(/^#/, "")}` : "";
  return `https://cdn.simpleicons.org/${platform.slug}${suffix}`;
}
