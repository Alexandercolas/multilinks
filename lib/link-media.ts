// Detects links that can be shown as a rich card (large preview) on a profile.
// Everything is derived from the URL the user already entered — no network calls,
// so there is no SSRF surface and nothing to fetch on every profile view.

import { detectPlatform, type Platform } from "@/lib/platforms";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// Music / short-video platforms that get a branded media card. We can't pull
// artwork without an external oEmbed call, so the card leans on brand identity
// instead. The architecture is ready to add real thumbnails later.
const BRANDED_MEDIA: Record<string, string> = {
  spotify: "Escuchar en Spotify",
  tiktok: "Ver en TikTok",
  soundcloud: "Escuchar en SoundCloud",
  applemusic: "Escuchar en Apple Music",
};

export type LinkMedia =
  | { kind: "youtube"; videoId: string; thumbnail: string }
  | { kind: "branded"; platform: Platform; action: string };

function youtube(id: string): LinkMedia | null {
  return YOUTUBE_ID.test(id)
    ? { kind: "youtube", videoId: id, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }
    : null;
}

export function getLinkMedia(url: string): LinkMedia | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "youtu.be") {
    return youtube(parsed.pathname.slice(1).split(/[/?#]/)[0]);
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const fromQuery = parsed.searchParams.get("v");
    const fromPath = parsed.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1];
    return youtube(fromQuery ?? fromPath ?? "");
  }

  const platform = detectPlatform(url);
  if (platform && BRANDED_MEDIA[platform.id]) {
    return { kind: "branded", platform, action: BRANDED_MEDIA[platform.id] };
  }
  return null;
}
