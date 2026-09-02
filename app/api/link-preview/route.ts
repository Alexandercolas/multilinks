import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRouteRequest } from "@/lib/security/rate-limit";
import { isSameOriginRequest } from "@/lib/security/same-origin";
import { SsrfError, assertPublicUrl } from "@/lib/security/ssrf";
import { resolveLinkPreview } from "@/lib/link-preview";

const requestSchema = z.object({ url: z.string().trim().min(4).max(600) });
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });

  const allowed = await allowRouteRequest(request, "link-preview", user.id, 40, 10 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiados análisis. Espera un momento." }, { status: 429 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "URL inválida." }, { status: 400 });

  let normalized: string;
  try {
    normalized = (await assertPublicUrl(parsed.data.url)).toString();
  } catch (error) {
    if (error instanceof SsrfError) {
      return NextResponse.json({ error: "No podemos analizar esa dirección." }, { status: 422 });
    }
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  const urlHash = createHash("sha256").update(normalized).digest("hex");
  const admin = createAdminClient();

  const { data: cached } = await admin
    .from("link_preview_cache")
    .select("payload,fetched_at")
    .eq("url_hash", urlHash)
    .maybeSingle();
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ preview: cached.payload, cached: true });
  }

  try {
    const preview = await resolveLinkPreview(normalized);
    await admin
      .from("link_preview_cache")
      .upsert({ url_hash: urlHash, url: normalized, payload: preview, fetched_at: new Date().toISOString() });
    return NextResponse.json({ preview, cached: false });
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error("Link preview failed"));
    return NextResponse.json({ error: "No pudimos analizar el enlace." }, { status: 502 });
  }
}
