"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import Image from "next/image";
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
  const [loaded, setLoaded] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    if (linkId) {
      fetch(`/api/play/${linkId}`, { method: "POST", keepalive: true }).catch(
        () => {},
      );
    }
  };

  if (playing) {
    return (
      <div className={`w-full overflow-hidden ${rounded}`}>
        <div
          className={
            embed.aspect === "video"
              ? "relative aspect-video w-full"
              : "relative w-full"
          }
          style={
            embed.aspect === "audio" ? { height: embed.heightPx } : undefined
          }
        >
          {!loaded ? (
            <div
              aria-hidden="true"
              className={`absolute inset-0 animate-pulse ${dark ? "bg-white/[.06]" : "bg-black/[.05]"}`}
            />
          ) : null}
          <iframe
            src={embed.src}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow={embed.allow}
            allowFullScreen={embed.aspect === "video"}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
          />
        </div>
        {/* Always-available exit in case the platform refuses to render inside the frame. */}
        <a
          href={externalHref}
          target="_blank"
          rel="noreferrer"
          className={`profile-focus flex min-h-11 items-center justify-center px-3 text-center text-xs font-medium ${dark ? "bg-white/[.05] text-white/80" : "bg-black/[.03] text-ink/80"}`}
        >
          Abrir en {label} ↗
        </a>
      </div>
    );
  }

  if (embed.aspect === "audio")
    return (
      <button
        type="button"
        onClick={handlePlay}
        aria-label={`Reproducir ${title} (${label})`}
        className={`profile-link group flex min-h-28 w-full items-center gap-4 p-4 text-left ${dark ? "bg-white/[.025]" : "bg-ink/[.025]"}`}
      >
        {thumbnail ? (
          <Image
            unoptimized
            src={thumbnail}
            alt=""
            width={72}
            height={72}
            loading="lazy"
            className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            Escuchar en {label}
          </span>
          <span className="mt-1 block text-xs leading-5">
            Abrir el reproductor
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${dark ? "bg-white text-ink" : "bg-ink text-white"}`}
        >
          <Play
            aria-hidden="true"
            size={17}
            className="translate-x-px fill-current"
          />
        </span>
      </button>
    );

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`Reproducir ${title} (${label})`}
      className="profile-link group relative block aspect-video w-full cursor-pointer overflow-hidden bg-ink"
    >
      {thumbnail ? (
        <Image
          unoptimized
          src={thumbnail}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink transition group-hover:scale-[1.03] motion-reduce:transition-none"
      >
        <Play
          aria-hidden="true"
          size={18}
          className="translate-x-0.5 fill-current"
        />
      </span>
    </button>
  );
}
