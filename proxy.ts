import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { authRequestOrigin, safeAuthDestination } from "@/lib/auth-navigation";

export async function proxy(request: NextRequest) {
  const origin = authRequestOrigin(request);
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isSignIn = request.nextUrl.pathname.startsWith("/sign-in");
  const isProtected = isDashboard || isAdminRoute;

  if (isProtected && !user) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      origin,
    );
    url.pathname = "/sign-in";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  let suspended = false;
  if (user && (isProtected || isSignIn)) {
    const { data } = await supabase.rpc("account_is_suspended");
    suspended = data === true;
  }

  if (user && suspended && isProtected) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      origin,
    );
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("suspended", "1");
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      const url = new URL(
        request.nextUrl.pathname + request.nextUrl.search,
        origin,
      );
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (isSignIn && user && !suspended) {
    return NextResponse.redirect(
      new URL(
        safeAuthDestination(request.nextUrl.searchParams.get("next")),
        origin,
      ),
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!monitoring(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
