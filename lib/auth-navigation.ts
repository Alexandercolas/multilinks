/** Only destinations used by our authenticated flows may be resumed. */
export function safeAuthDestination(value: string | null | undefined) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return "/dashboard";
  const url = new URL(value, "https://multilinks.invalid");
  if (
    url.origin !== "https://multilinks.invalid" ||
    !(
      url.pathname === "/dashboard" ||
      url.pathname.startsWith("/dashboard/") ||
      url.pathname === "/reset-password"
    )
  )
    return "/dashboard";
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Use the public origin when the app is served behind a proxy. */
export function authRequestOrigin(request: Request) {
  const fallback = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    fallback.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    fallback.protocol.replace(":", "");
  try {
    const origin = new URL(
      process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`,
    );
    if (
      ["http:", "https:"].includes(origin.protocol) &&
      !origin.username &&
      !origin.password &&
      origin.pathname === "/" &&
      !origin.search &&
      !origin.hash
    )
      return origin.origin;
  } catch {
    /* Fall back to the request URL. */
  }
  return fallback.origin;
}
