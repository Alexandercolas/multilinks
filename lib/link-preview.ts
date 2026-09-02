import "server-only";

import { detectPlatform, type Platform, type ProviderKind } from "@/lib/platforms";
import { fetchPublicUrl } from "@/lib/security/ssrf";
import type { LinkPreview, SmartCardType } from "@/lib/link-preview-types";

const MAX_TEXT = 280;
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]+", "g");

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2f;/gi, "/")
    .replace(/&nbsp;/g, " ");
}

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return decodeEntities(value)
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

function httpsUrl(value: unknown, base?: string): string {
  if (typeof value !== "string" || !value.trim()) return "";
  let candidate = value.trim();
  try {
    candidate = base ? new URL(candidate, base).toString() : candidate;
  } catch {
    return "";
  }
  if (!/^https:\/\//i.test(candidate) || candidate.length > 590) return "";
  return candidate;
}

function cardTypeFor(kind: ProviderKind, hasImage: boolean): SmartCardType {
  if (kind === "action") return "action";
  if (kind === "social") return "social";
  if ((kind === "video" || kind === "music" || kind === "design") && hasImage) return "media";
  return "standard";
}

/** Order-agnostic <meta> reader: property/name and content in either order. */
function readMeta(html: string, keys: string[]): string {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*\\scontent=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) return clean(match[1]);
    }
  }
  return "";
}

function readFavicon(html: string, base: string): string {
  const match =
    html.match(/<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*\shref=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["']/i);
  return match ? httpsUrl(match[1], base) : "";
}

function pruneEmpty(value: Partial<LinkPreview>): Partial<LinkPreview> {
  const result: Partial<LinkPreview> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry) (result as Record<string, unknown>)[key] = entry;
  }
  return result;
}

async function fromOembed(platform: Platform, url: string): Promise<Partial<LinkPreview> | null> {
  if (!platform.oembed) return null;
  try {
    const endpoint = `${platform.oembed}?url=${encodeURIComponent(url)}&format=json`;
    const { body, contentType } = await fetchPublicUrl(endpoint, {
      accept: "application/json",
      maxBytes: 96_000,
      timeoutMs: 5_000,
    });
    if (!contentType.toLowerCase().includes("json")) return null;
    const data = JSON.parse(body) as Record<string, unknown>;
    return {
      title: clean(data.title),
      description: clean(data.author_name),
      image: httpsUrl(data.thumbnail_url),
    };
  } catch {
    return null;
  }
}

async function fromOpenGraph(url: string): Promise<Partial<LinkPreview> | null> {
  try {
    const { body, url: finalUrl, contentType } = await fetchPublicUrl(url, {
      accept: "text/html,application/xhtml+xml",
      maxBytes: 262_144,
      timeoutMs: 6_000,
    });
    if (!contentType.toLowerCase().includes("html") && body.trim()[0] !== "<") return null;
    const head = body.slice(0, 200_000);
    const titleTag = head.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = readMeta(head, ["og:title", "twitter:title"]) || clean(titleTag ? titleTag[1] : "");
    const description = readMeta(head, ["og:description", "twitter:description", "description"]);
    const image = httpsUrl(readMeta(head, ["og:image:secure_url", "og:image", "twitter:image"]), finalUrl);
    const siteName = readMeta(head, ["og:site_name", "application-name"]);
    const favicon = readFavicon(head, finalUrl);
    if (!title && !description && !image) return null;
    return { title, description, image, siteName, favicon };
  } catch {
    return null;
  }
}

/** Analyse a URL and return a sanitised preview. Never throws for a valid URL. */
export async function resolveLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const platform = detectPlatform(rawUrl);
  const kind: ProviderKind = platform?.kind ?? "generic";
  const provider = platform?.id ?? "generic";

  const base: LinkPreview = {
    provider,
    kind,
    cardType: cardTypeFor(kind, false),
    title: "",
    description: "",
    image: "",
    favicon: "",
    siteName: platform?.label ?? "",
  };

  let data: Partial<LinkPreview> | null = null;
  if (platform?.oembed) data = await fromOembed(platform, rawUrl);
  if (!data || (!data.title && !data.image)) {
    const og = await fromOpenGraph(rawUrl).catch(() => null);
    if (og) data = { ...og, ...pruneEmpty(data ?? {}) };
  }

  const merged: LinkPreview = { ...base, ...pruneEmpty(data ?? {}) };
  merged.provider = provider;
  merged.kind = kind;
  merged.cardType = cardTypeFor(kind, Boolean(merged.image));
  return merged;
}
