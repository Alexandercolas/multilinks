import { NextResponse } from "next/server";
import { allowRouteRequest } from "@/lib/security/rate-limit";
import { SsrfError, fetchPublicBinary } from "@/lib/security/ssrf";

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

export async function GET(request: Request) {
  const host = new URL(request.url).searchParams.get("host")?.toLowerCase().trim() ?? "";
  if (!HOST.test(host)) return miss();

  const allowed = await allowRouteRequest(request, "favicon", "public", 240, 60);
  if (!allowed) return miss();

  const own = await tryFetch(`https://${host}/favicon.ico`);
  if (own) return own;

  const google = await tryFetch(
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`,
  );
  if (google) return google;

  return miss();
}
