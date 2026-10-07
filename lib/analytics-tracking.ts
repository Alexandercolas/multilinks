import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function recordAnalytics(request: Request, kind: string, profile: string | null, link: string | null, page?: string, referrer?: string, linkIds?: string[]) {
  try {
    if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return;
    const ua = request.headers.get("user-agent") ?? "";
    if (/bot|crawler|spider|headless/i.test(ua)) return;
    const jar = await cookies();
    if (kind === "heartbeat" && !jar.has("ml_session")) kind = "page_view";
    const secure = new URL(request.url).protocol === "https:";
    const options = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
    const readId = (name: string) => { const value = jar.get(name)?.value; return value && uuid.test(value) ? value : randomUUID(); };
    const visitor = readId("ml_visitor");
    const session = readId("ml_session");
    jar.set("ml_visitor", visitor, { ...options, maxAge: 60 * 60 * 24 * 90 });
    jar.set("ml_session", session, { ...options, maxAge: 60 * 30 });
    const utm: Record<string, string> = {};
    if (page) {
      const url = new URL(page, request.url);
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
        const value = url.searchParams.get(key)?.replace(/[\u0000-\u001f]/g, "").slice(0, 100);
        if (value) utm[key] = value;
      }
    }
    let source = "Direct";
    if (utm.utm_source) source = utm.utm_source;
    else if (referrer) {
      try {
        const host = new URL(referrer).hostname.toLowerCase();
        if (host !== new URL(request.url).hostname) {
          source = ["instagram", "tiktok", "facebook", "google", "youtube"].find(x => host === `${x}.com` || host.endsWith(`.${x}.com`)) ?? "Other";
        }
      } catch { source = "Unknown"; }
    }
    const context = {
      visitor, session, source, utm, links: linkIds ?? [],
      device: /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? "Tablet" : /Mobile|iPhone/i.test(ua) ? "Mobile" : "Desktop",
      browser: /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome|CriOS/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Other",
      os: /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other",
    };
    await createAdminClient().rpc("record_analytics_event", { p_profile: profile, p_link: link, p_kind: kind, p_context: context });
  } catch { /* Analytics must never interrupt public navigation. */ }
}
