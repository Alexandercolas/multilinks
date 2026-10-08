"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Music2, Video } from "lucide-react";
import { detectPlatform, platformIconUrl } from "@/lib/platforms";

export function LinkFavicon({
  url,
  title,
  src,
}: {
  url: string;
  title: string;
  src?: string;
}) {
  const sources = useMemo(() => {
    const platform = detectPlatform(url);
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      return [
        // The favicon the site itself declares (scraped at preview time and
        // proxied through our origin) — the accurate one.
        src && /^(https:\/\/|\/api\/img\?|\/api\/favicon\?)/i.test(src)
          ? src
          : null,
        platform ? platformIconUrl(platform) : null,
        // Served from our own origin — third-party favicon CDNs now send a
        // restrictive Cross-Origin-Resource-Policy and get blocked.
        `/api/favicon?host=${encodeURIComponent(hostname)}`,
      ].filter((source): source is string => Boolean(source));
    } catch {
      return src ? [src] : [];
    }
  }, [url, src]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  useEffect(() => setSourceIndex(0), [url, src]);
  const favicon = sources[sourceIndex];
  const platform = detectPlatform(url);
  const Icon =
    platform?.kind === "music"
      ? Music2
      : platform?.kind === "video"
        ? Video
        : Link2;
  return (
    <span className="relative grid h-6 w-6 place-items-center">
      <Icon
        size={18}
        aria-hidden="true"
        className={favicon && loadedSource === favicon ? "opacity-0" : ""}
      />
      {favicon ? (
        <img
          src={favicon}
          alt={`Logo de ${title}`}
          width="24"
          height="24"
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-6 w-6 object-contain ${loadedSource === favicon ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoadedSource(favicon)}
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : null}
    </span>
  );
}
