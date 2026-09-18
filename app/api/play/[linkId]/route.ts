import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestFingerprint } from "@/lib/request-fingerprint";

// Fire-and-forget ping from <MediaEmbed> when a visitor actually presses play
// on an official embed. Separate counter from a plain link click. Same
// rate-limit shape as /api/click — a burst just stops incrementing, it never
// errors back to the visitor.
export async function POST(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  const eventKey = requestFingerprint(request, `play:${linkId}`);
  const { data: allowed } = await supabase.rpc("check_analytics_rate_limit", {
    target_key: eventKey,
    max_hits: 30,
    window_seconds: 600,
  });
  if (allowed) {
    await supabase.rpc("record_link_play", { target_link: linkId });
  }
  return NextResponse.json({ ok: true });
}
