"use client";

import Image from "next/image";
import { Music2, Video } from "lucide-react";
import { useState } from "react";

export function MediaArtwork({
  src,
  kind,
  compact = false,
}: {
  src: string | null;
  kind: "audio" | "video";
  compact?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const Icon = kind === "audio" ? Music2 : Video;
  return (
    <span
      aria-hidden="true"
      data-media-artwork={kind}
      className={`grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br from-[#263332] to-[#151c27] text-white/80 ${compact ? "relative h-[72px] w-[72px] rounded-xl" : "absolute inset-0 h-full w-full"}`}
    >
      <Icon
        size={28}
        strokeWidth={1.5}
        className={compact ? undefined : "absolute left-4 top-4 opacity-70"}
      />
      {src && failedSource !== src ? (
        <Image
          key={src}
          unoptimized
          src={src}
          alt=""
          width={compact ? 72 : 640}
          height={compact ? 72 : 360}
          loading="lazy"
          onError={() => setFailedSource(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}
