import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/auth/", "/sign-in", "/forgot-password", "/reset-password", "/api/"],
    },
    sitemap: "https://multilinks-app.vercel.app/sitemap.xml",
    host: "https://multilinks-app.vercel.app",
  };
}
