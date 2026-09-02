"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { detectPlatform, platformIconUrl } from "@/lib/platforms";

export function LinkFavicon({ url, title }: { url: string; title: string }) {
  const sources = useMemo(() => {
    const platform = detectPlatform(url);
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      return [
        platform ? platformIconUrl(platform) : null,
        new URL("/favicon.ico", parsed.origin).toString(),
        `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`,
        `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(parsed.origin)}&sz=64`,
      ].filter((source): source is string => Boolean(source));
    } catch {
      return [];
    }
  }, [url]);
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [url]);
  const favicon = sources[sourceIndex];
  if (!favicon) return <Link2 size={18} aria-hidden="true" />;
  return (
    <img
      src={favicon}
      alt={`Logo de ${title}`}
      width="24"
      height="24"
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-6 w-6 object-contain"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}
