import "server-only";
import { createHash } from "node:crypto";

export function requestFingerprint(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${scope}|${forwarded}|${agent}`).digest("hex");
}
