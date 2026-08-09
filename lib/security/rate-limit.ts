import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function allowRequest(scope: string, identity: string, maxHits: number, windowSeconds: number) {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-vercel-forwarded-for") ?? headerStore.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(`${scope}:${ip}:${identity.toLowerCase()}`).digest("hex");
  const { data, error } = await createAdminClient().rpc("check_request_rate_limit", {
    target_key: key,
    max_hits: maxHits,
    window_seconds: windowSeconds,
  });
  return !error && data === true;
}
