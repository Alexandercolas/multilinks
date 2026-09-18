"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { EmbedInfo } from "@/lib/media-embed";

// Click-to-play: the official iframe is never mounted until the visitor asks
// for it. Keeps the page light and avoids autoplaying audio/video no one
// requested. If the platform ends up refusing to render inside the frame,
// "Abrir en <label>" is always right there as the way out.
export function MediaEmbed({
  embed,
  thumbnail,
  title,
  label,
  externalHref,
  rounded,
  dark = false,
  linkId,
}: {
  embed: EmbedInfo;
  thumbnail: string | null;
  title: string;
  label: string;
  externalHref: string;
  rounded: string;
  dark?: boolean;
  /** DB id of the link, for the play analytics ping. Omit in previews/demos. */
  linkId?: string;
}) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    if (linkId) {
      fetch(`/api/play/${linkId}`, { method: "POST", keepalive: true }).catch(() => {});
    }
  };

  if (playing) {
    return (
      <div className={`w-full overflow-hidden ${rounded}`}>
        <div className={embed.aspect === "video" ? "relative aspect-video w-full" : "relative w-full"} style={embed.aspect === "audio" ? { height: embed.heightPx } : undefined}>
          <iframe
            src={embed.src}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow={embed.allow}
            allowFullScreen={embed.aspect === "video"}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
          />
        </div>
        {/* Always-available exit in case the platform refuses to render inside the frame. */}
        <a
          href={externalHref}
          target="_blank"
          rel="noreferrer"
          className={`block px-3 py-1.5 text-center text-[11px] font-semibold transition ${dark ? "bg-white/[.05] text-white/45 hover:text-white/75" : "bg-black/[.03] text-ink/45 hover:text-ink/70"}`}
        >
          Abrir en {label} ↗
        </a>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`Reproducir ${title} (${label})`}
      className="group relative block aspect-video w-full cursor-pointer bg-cover bg-center"
      style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : { backgroundColor: "rgba(0,0,0,.4)" }}
    >
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-lg transition group-hover:scale-105 motion-reduce:transition-none"
      >
        <Play size={18} className="translate-x-0.5 fill-current" />
      </span>
    </button>
  );
}
