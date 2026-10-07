import { recordAnalytics } from "@/lib/analytics-tracking";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestFingerprint } from "@/lib/request-fingerprint";
import { isSameOriginRequest } from "@/lib/security/same-origin";
export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  if (!isSameOriginRequest(request) || !/^[0-9a-f-]{36}$/i.test(profileId)) return new Response(null, { status: 400 });
  const size = Number(request.headers.get("content-length"));
  if (size > 4096) return new Response(null, { status: 413 });
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.links) || body.links.length > 50 || body.links.some((x: unknown) => typeof x !== "string" || !/^[0-9a-f-]{36}$/i.test(x))) return new Response(null, { status: 400 });
  const { data: allowed } = await createAdminClient().rpc("check_analytics_rate_limit", { target_key: requestFingerprint(request, `impressions:${profileId}`), max_hits: 60, window_seconds: 600 });
  if (allowed) await recordAnalytics(request, "link_views", profileId, null, undefined, undefined, [...new Set<string>(body.links)]);
  return new Response(null, { status: 204 });
}
