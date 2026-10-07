import "server-only";
import { headers } from "next/headers";

/** Use the configured public origin, or the current deployment's request origin. */
export async function publicProfileUrl(username: string) {
  const requestHeaders = await headers();
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  let origin: string;
  if (configured) {
    const url = new URL(configured);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error("Invalid public origin");
    origin = url.origin;
  } else {
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
    if (
      !host ||
      !/^[a-z0-9.\-\[\]:]+$/i.test(host) ||
      !["http", "https"].includes(protocol)
    )
      throw new Error("Public origin unavailable");
    origin = new URL(`${protocol}://${host}`).origin;
  }
  return new URL(`/${encodeURIComponent(username)}`, origin).href;
}
