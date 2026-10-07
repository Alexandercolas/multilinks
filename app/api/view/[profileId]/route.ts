import { recordAnalytics } from "@/lib/analytics-tracking";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestFingerprint } from "@/lib/request-fingerprint";

export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return new Response(null, { status: 400 });
  if (Number(request.headers.get("content-length")) > 4096) return new Response(null, { status: 413 });
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object") return new Response(null, { status: 400 });
  const supabase = createAdminClient();
  const eventKey = requestFingerprint(request, `${body.heartbeat ? "heartbeat" : "view"}:${profileId}`);
  const { data: allowed } = await supabase.rpc("check_analytics_rate_limit", { target_key: eventKey, max_hits: body.heartbeat ? 20 : 10, window_seconds: 600 });
  if (allowed) {
    if (!body.heartbeat) await supabase.rpc("record_profile_view", { target_profile: profileId });
    await recordAnalytics(request, body.heartbeat ? "heartbeat" : "page_view", profileId, null, typeof body.page === "string" ? body.page.slice(0, 2048) : undefined, typeof body.referrer === "string" ? body.referrer.slice(0, 2048) : undefined);
  }
  return new Response(null, { status: 204 });
}
