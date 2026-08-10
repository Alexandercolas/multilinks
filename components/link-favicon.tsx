"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";

export function LinkFavicon({ url, title }: { url: string; title: string }) {
  const sources = useMemo(() => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      const brand = hostname.includes("tiktok.com") ? "tiktok"
        : hostname.includes("instagram.com") ? "instagram"
        : hostname.includes("youtube.com") || hostname.includes("youtu.be") ? "youtube"
        : hostname.includes("spotify.com") ? "spotify"
        : hostname.includes("github.com") ? "github"
        : hostname.includes("linkedin.com") ? "linkedin"
        : null;
      return [
        brand ? `https://cdn.simpleicons.org/${brand}` : null,
        new URL("/favicon.ico", parsed.origin).toString(),
        `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`,
        `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(parsed.origin)}&sz=64`,
      ].filter((source): source is string => Boolean(source));
    } catch { return []; }
  }, [url]);
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [url]);
  const favicon = sources[sourceIndex];
  if (!favicon) return <Link2 size={21} aria-hidden="true"/>;
  return <img src={favicon} alt={`Logo de ${title}`} width="28" height="28" loading="lazy" referrerPolicy="no-referrer" className="h-7 w-7 object-contain" onError={() => setSourceIndex((index) => index + 1)}/>;
}
