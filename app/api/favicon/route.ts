import { NextResponse } from "next/server";
import { allowRouteRequest } from "@/lib/security/rate-limit";
import { SsrfError, fetchPublicBinary, fetchPublicUrl } from "@/lib/security/ssrf";

// A site's own favicon (and third-party favicon CDNs) increasingly ship
// "Cross-Origin-Resource-Policy: same-origin", so the browser refuses to paint
// them on a profile page. We re-serve the icon from our own origin.
//
// `host` is a bare hostname. We try the site's own /favicon.ico (SSRF-guarded)
// and fall back to Google's favicon service. Nothing arbitrary is fetched.

const HOST = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const IMAGE_TYPE = /^image\/(png|jpeg|webp|gif|avif|x-icon|vnd\.microsoft\.icon)$/;
const MAX_BYTES = 300_000;

function miss() {
  // 404 so the <img onError> chain in <LinkFavicon> falls back to its glyph.
  return new NextResponse(null, { status: 404 });
}

function serve(bytes: Uint8Array, type: string) {
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

async function tryFetch(url: string): Promise<NextResponse | null> {
  try {
    const { contentType, bytes } = await fetchPublicBinary(url, {
      accept: "image/x-icon,image/png,image/svg+xml,image/*",
      maxBytes: MAX_BYTES,
      timeoutMs: 5_000,
    });
    const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!IMAGE_TYPE.test(type) || bytes.byteLength < 70) return null;
    return serve(bytes, type);
  } catch (error) {
    if (error instanceof SsrfError) return null;
    return null;
  }
}

/** Read the first <link rel="...icon..."> the site declares in its <head>. */
async function iconFromHomepage(host: string): Promise<string | null> {
  try {
    const { body, url } = await fetchPublicUrl(`https://${host}/`, {
      accept: "text/html",
      maxBytes: 96_000,
      timeoutMs: 5_000,
    });
    const head = body.slice(0, 96_000);
    const match =
      head.match(/<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*\shref=["']([^"']+)["']/i) ??
      head.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["']/i);
    if (!match) return null;
    const resolved = new URL(match[1], url).toString();
    return /^https:\/\//i.test(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const host = new URL(request.url).searchParams.get("host")?.toLowerCase().trim() ?? "";
  if (!HOST.test(host)) return miss();

  const allowed = await allowRouteRequest(request, "favicon", "public", 240, 60);
  if (!allowed) return miss();

  // 1. The conventional /favicon.ico.
  const own = await tryFetch(`https://${host}/favicon.ico`);
  if (own) return own;

  // 2. Whatever <link rel="icon"> the site declares (may live under a path).
  const declared = await iconFromHomepage(host);
  if (declared) {
    const fromLink = await tryFetch(declared);
    if (fromLink) return fromLink;
  }

  // 3. Google's favicon service as a last resort.
  const google = await tryFetch(
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`,
  );
  if (google) return google;

  return miss();
}
