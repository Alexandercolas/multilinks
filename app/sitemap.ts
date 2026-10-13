import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";
const siteUrl = "https://multilinksrd.vercel.app";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    "",
    "/demo",
    "/planes",
    "/ayuda",
    "/terminos",
    "/privacidad",
  ].map((path) => ({ url: siteUrl + path }));
  if (!supabaseUrl || !supabaseAnonKey) return entries;
  // Always use anonymous visibility rules: private/suspended profiles cannot leak
  // into the public sitemap through the requesting administrator's session.
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const batchSize = 1000;
  // One XML sitemap supports at most 50,000 URLs, including static pages.
  for (let offset = 0; entries.length < 50000; offset += batchSize) {
    const { data, error } = await client
      .from("profiles")
      .select("username,updated_at")
      .eq("published", true)
      .order("username")
      .range(offset, offset + batchSize - 1);
    if (error) throw new Error("Could not load public sitemap profiles");
    for (const profile of data || []) {
      if (!profile.username || !/^[-a-z0-9_]{3,30}$/.test(profile.username))
        continue;
      const date = new Date(profile.updated_at);
      entries.push({
        url: `${siteUrl}/${profile.username}`,
        ...(Number.isFinite(date.getTime()) ? { lastModified: date } : {}),
      });
      if (entries.length === 50000) break;
    }
    if (!data || data.length < batchSize) break;
  }
  return entries;
}
