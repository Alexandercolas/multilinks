// Detects links that can be shown as a rich card (large preview) on a profile.
// Everything is derived from the URL the user already entered — no network calls,
// so there is no SSRF surface and nothing to fetch on every profile view.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_TYPES = ["track", "album", "playlist", "artist", "episode", "show"] as const;

export type LinkMedia =
  | { kind: "youtube"; videoId: string; thumbnail: string }
  | { kind: "spotify"; embedType: (typeof SPOTIFY_TYPES)[number] };

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
  if (host === "open.spotify.com") {
    const type = parsed.pathname.match(/^\/(?:embed\/)?([a-z]+)\/[A-Za-z0-9]+/)?.[1];
    const match = SPOTIFY_TYPES.find((value) => value === type);
    return match ? { kind: "spotify", embedType: match } : null;
  }
  return null;
}
