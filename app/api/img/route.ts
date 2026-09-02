import { NextResponse } from "next/server";
import { allowRouteRequest } from "@/lib/security/rate-limit";
import { SsrfError, fetchPublicBinary } from "@/lib/security/ssrf";
import { verifyProxiedImage } from "@/lib/security/image-proxy";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = verifyProxiedImage(searchParams.get("u"), searchParams.get("s"));
  if (!target) {
    return new NextResponse("Firma inválida", { status: 403 });
  }

  const allowed = await allowRouteRequest(request, "img", "public", 240, 60);
  if (!allowed) {
    return new NextResponse("Demasiadas solicitudes", { status: 429 });
  }

  try {
    const { contentType, bytes } = await fetchPublicBinary(target, {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5",
      maxBytes: MAX_BYTES,
      timeoutMs: 8_000,
    });
    const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!ALLOWED_TYPES.has(type)) {
      return new NextResponse("Tipo no permitido", { status: 415 });
    }
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": type === "image/jpg" ? "image/jpeg" : type,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    if (error instanceof SsrfError) {
      return new NextResponse("No disponible", { status: 422 });
    }
    return new NextResponse("Error al obtener la imagen", { status: 502 });
  }
}
