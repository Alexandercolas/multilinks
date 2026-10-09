import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authRequestOrigin, safeAuthDestination } from "@/lib/auth-navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = authRequestOrigin(request);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error)
      return NextResponse.redirect(new URL("/sign-in?authError=1", origin));
  } else {
    return NextResponse.redirect(new URL("/sign-in?authError=1", origin));
  }
  const requestedNext = url.searchParams.get("next");
  const next = safeAuthDestination(requestedNext);
  return NextResponse.redirect(new URL(next, origin));
}
