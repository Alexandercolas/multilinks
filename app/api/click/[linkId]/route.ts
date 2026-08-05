import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestFingerprint } from "@/lib/request-fingerprint";

export async function GET(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) return NextResponse.redirect(new URL("/", request.url));
  const supabase = createAdminClient();
  const eventKey = requestFingerprint(request, `click:${linkId}`);
  const { data: allowed } = await supabase.rpc("check_analytics_rate_limit", { target_key: eventKey, max_hits: 30, window_seconds: 600 });
  const { data: destination } = await supabase.rpc(allowed ? "record_link_click" : "public_link_destination", { target_link: linkId });
  if (typeof destination !== "string" || !/^https?:\/\//i.test(destination)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(destination, 307);
}
