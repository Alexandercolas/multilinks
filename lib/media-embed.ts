// Builds an *official* iframe embed URL for platforms that offer one, straight
// from the link's own URL — no network calls, no scraping, nothing fake. When a
// platform has no safe official embed (TikTok's is a script+blockquote, YouTube
// Music has none), this returns null and the caller keeps the existing
// thumbnail + "open in X" card. Never used to bypass a platform's own access
// rules — it only points an <iframe> at the URL the platform itself serves for
// embedding.

import { detectPlatform, type PlatformId } from "@/lib/platforms";

export type EmbedInfo = {
  src: string;
  /** "video" = 16:9 box, "audio" = fixed short height (a player strip). */
  aspect: "video" | "audio";
  /** Only meaningful for aspect "audio". */
  heightPx?: number;
  allow: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split(/[/?#]/)[0] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function spotifyEmbed(url: URL): EmbedInfo | null {
  const match = url.pathname.match(/^\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  if (!match) return null;
  const [, kind, id] = match;
  const compact = kind === "track" || kind === "episode";
  return {
    src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=multilinks`,
    aspect: "audio",
    heightPx: compact ? 152 : 380,
    allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
  };
}

function soundcloudEmbed(url: URL): EmbedInfo {
  const isSet = /\/sets\//.test(url.pathname);
  return {
    src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}&color=%23ff5500&auto_play=false&show_user=true&visual=false`,
    aspect: "audio",
    heightPx: isSet ? 300 : 166,
    allow: "autoplay",
  };
}

function appleMusicEmbed(url: URL): EmbedInfo {
  const isSong = /\/song\//.test(url.pathname) || url.searchParams.has("i");
  return {
    src: `https://embed.music.apple.com${url.pathname}${url.search}`,
    aspect: "audio",
    heightPx: isSong ? 175 : 450,
    allow: "autoplay *; encrypted-media *;",
  };
}

function deezerEmbed(url: URL): EmbedInfo | null {
  const match = url.pathname.match(/\/(track|album|playlist)\/(\d+)/);
  if (!match) return null;
  const [, kind, id] = match;
  return {
    src: `https://widget.deezer.com/widget/auto/${kind}/${id}`,
    aspect: "audio",
    heightPx: 152,
    allow: "encrypted-media; clipboard-write",
  };
}

function vimeoEmbed(url: URL): EmbedInfo | null {
  const match = url.pathname.match(/(\d{6,})/);
  if (!match) return null;
  return {
    src: `https://player.vimeo.com/video/${match[1]}`,
    aspect: "video",
    allow: "autoplay; fullscreen; picture-in-picture",
  };
}

/** Returns null when the platform has no safe official embed for this URL. */
export function embedInfoFor(rawUrl: string, platformId?: PlatformId | null): EmbedInfo | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const id = platformId ?? detectPlatform(rawUrl)?.id;

  switch (id) {
    case "youtube": {
      const videoId = youtubeVideoId(url);
      return videoId
        ? {
            src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
            aspect: "video",
            allow: "accelerometer; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share",
          }
        : null;
    }
    case "spotify":
      return spotifyEmbed(url);
    case "soundcloud":
      return soundcloudEmbed(url);
    case "applemusic":
      return appleMusicEmbed(url);
    case "deezer":
      return deezerEmbed(url);
    case "vimeo":
      return vimeoEmbed(url);
    default:
      return null;
  }
}
