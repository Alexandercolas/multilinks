import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) return NextResponse.redirect(new URL("/", request.url));
  const supabase = await createClient();
  const { data: destination } = await supabase.rpc("record_link_click", { target_link: linkId });
  if (typeof destination !== "string" || !/^https?:\/\//i.test(destination)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(destination, 307);
}
