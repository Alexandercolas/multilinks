"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { detectPlatform } from "@/lib/platforms";
import { LinkFavicon } from "@/components/link-favicon";

const themes = {
  violet: { label: "Violeta", shell: "bg-grape text-white", accent: "#c9ff58", dark: false },
  neon: { label: "Neon Dark", shell: "bg-[#0f1115] text-white", accent: "#c9ff58", dark: true },
  lime: { label: "Lima", shell: "bg-[#eef7d6] text-ink", accent: "#8566ff", dark: false },
} as const;

const demoLinks = [
  { title: "Instagram", subtitle: "Contenido diario", url: "https://instagram.com" },
  { title: "YouTube", subtitle: "Videos y tutoriales", url: "https://youtube.com" },
  { title: "Spotify", subtitle: "Mi música", url: "https://spotify.com" },
  { title: "GitHub", subtitle: "Proyectos y código", url: "https://github.com" },
];

export function LandingProfileDemo() {
  const [themeName, setThemeName] = useState<keyof typeof themes>("violet");
  const theme = themes[themeName];

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="mb-5 flex flex-wrap justify-center gap-2" aria-label="Selecciona un tema para la demostración">
        {(Object.keys(themes) as Array<keyof typeof themes>).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setThemeName(name)}
            aria-pressed={themeName === name}
            className={`rounded-full px-3.5 py-2 text-xs font-black transition motion-reduce:transition-none ${themeName === name ? "bg-ink text-white" : "border border-ink/12 bg-white text-ink/60 hover:text-ink"}`}
          >
            {themes[name].label}
          </button>
        ))}
      </div>
      <div className="relative mx-auto rounded-[2.75rem] border border-ink/[.08] bg-white p-3 shadow-[0_2px_10px_rgba(21,21,21,.05),0_50px_80px_-40px_rgba(21,21,21,.35)]">
        <div className={`relative min-h-[560px] overflow-hidden rounded-[2rem] px-6 py-9 text-center ${theme.shell}`}>
          {theme.dark ? (
            <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_55%_at_50%_0%,rgba(255,255,255,.07),transparent_60%)]" />
          ) : null}
          <div className="relative">
            <div
              className={`mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] font-display text-xl font-black ${theme.dark ? "ring-1 ring-white/20" : "ring-1 ring-ink/[.06]"}`}
              style={{ backgroundColor: theme.dark ? "#c6ff3d" : theme.accent, color: "#151515" }}
            >
              ML
            </div>
            <h2 className="mt-5 font-display text-2xl font-black tracking-[-.02em]">Mi MultiLinks</h2>
            <p className={`mt-1.5 text-sm ${theme.dark ? "text-white/55" : "opacity-55"}`}>Contenido, proyectos y comunidad</p>
            <div className="mt-7 space-y-2.5 text-left">
              {demoLinks.map((item) => {
                const platform = detectPlatform(item.url);
                return (
                <div
                  key={item.title}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${theme.dark ? "border border-white/12 bg-white/[.06] text-white hover:border-white/25" : "border border-ink/[.07] bg-white text-ink shadow-[0_1px_2px_rgba(21,21,21,.04),0_10px_26px_-16px_rgba(21,21,21,.18)]"}`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${platform ? "" : theme.dark ? "border-white/10 bg-white/[.06]" : "border-ink/[.06] bg-ink/[.03]"}`}
                    style={platform ? { backgroundColor: `${platform.color}14`, borderColor: `${platform.color}40` } : undefined}
                  >
                    <LinkFavicon url={item.url} title={item.title} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold">{item.title}</strong>
                    <span className={`block truncate text-xs ${theme.dark ? "text-white/45" : "text-black/45"}`}>{item.subtitle}</span>
                  </span>
                  <ArrowUpRight size={16} className={theme.dark ? "text-white/40" : "text-ink/35"} />
                </div>
                );
              })}
            </div>
            <div className={`mx-auto mt-7 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[9px] font-black uppercase tracking-[.12em] ${theme.dark ? "border border-white/12 text-white/60" : "border border-ink/12 text-ink/50"}`}>
              <span aria-hidden="true" style={{ color: theme.dark ? "#c6ff3d" : "#7055e8" }}>⚡</span> Hecho con MultiLinks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
