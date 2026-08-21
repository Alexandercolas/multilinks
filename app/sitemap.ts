import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://multilinksrd.vercel.app";

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
    { url: `${siteUrl}/ayuda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ...(profiles ?? []).map((profile) => ({
      url: `${siteUrl}/${profile.username}`,
      lastModified: new Date(profile.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
