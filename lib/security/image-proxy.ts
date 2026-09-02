import "server-only";

import { createHmac } from "node:crypto";

// Many sites serve their og:image with "Cross-Origin-Resource-Policy: same-origin"
// (OZAMA CHESS does), so a browser refuses to paint it on another domain. We
// re-serve those images from our own origin through /api/img. The URL is signed
// so the route is not an open proxy: only links we resolved server-side can be
// fetched through it.

const secret = process.env.supabase_SUPABASE_SERVICE_ROLE_KEY ?? "";

function sign(value: string): string {
  return createHmac("sha256", secret).update(`img:${value}`).digest("base64url").slice(0, 24);
}

/**
 * Turn a remote https image URL into a signed same-origin path.
 * Returns "" for anything that is not a plain https URL.
 */
export function proxiedImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || !secret) return "";
  const value = rawUrl.trim();
  if (!/^https:\/\/[^\s"'<>]+$/i.test(value) || value.length > 1024) return "";
  const encoded = Buffer.from(value, "utf8").toString("base64url");
  return `/api/img?u=${encoded}&s=${sign(encoded)}`;
}

/** Verify a signed /api/img request. Returns the decoded https URL or null. */
export function verifyProxiedImage(encoded: string | null, signature: string | null): string | null {
  if (!encoded || !signature || !secret) return null;
  if (sign(encoded) !== signature) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  return /^https:\/\/[^\s"'<>]+$/i.test(decoded) && decoded.length <= 1024 ? decoded : null;
}
