import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://multilinks-app.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username,updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/demo`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...(profiles ?? []).map((profile) => ({
      url: `${siteUrl}/${profile.username}`,
      lastModified: new Date(profile.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
