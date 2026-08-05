import { createAdminClient } from "@/lib/supabase/admin";
import { requestFingerprint } from "@/lib/request-fingerprint";

export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return new Response(null, { status: 400 });
  const supabase = createAdminClient();
  const eventKey = requestFingerprint(request, `view:${profileId}`);
  const { data: allowed } = await supabase.rpc("check_analytics_rate_limit", { target_key: eventKey, max_hits: 10, window_seconds: 600 });
  if (allowed) await supabase.rpc("record_profile_view", { target_profile: profileId });
  return new Response(null, { status: 204 });
}
