"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { LinkFavicon } from "@/components/link-favicon";

const themes = {
  violet: { label: "Violeta", shell: "bg-grape text-white", accent: "#c9ff58", dark: false },
  neon: { label: "Neon Dark", shell: "bg-[#0f1115] text-white", accent: "#c9ff58", dark: true },
  lime: { label: "Lima", shell: "bg-lime text-ink", accent: "#8566ff", dark: false },
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

  return <div className="mx-auto w-full max-w-[430px]">
    <div className="mb-5 flex flex-wrap justify-center gap-2" aria-label="Selecciona un tema para la demostración">
      {(Object.keys(themes) as Array<keyof typeof themes>).map((name) => <button key={name} type="button" onClick={() => setThemeName(name)} aria-pressed={themeName === name} className={`rounded-full border-2 border-ink px-3 py-2 text-xs font-black transition motion-reduce:transition-none ${themeName === name ? "bg-ink text-white shadow-[3px_3px_0_#c9ff58]" : "bg-white text-ink hover:bg-lime"}`}>{themes[name].label}</button>)}
    </div>
    <div className={`group relative mx-auto rotate-[2deg] rounded-[44px] border-[3px] border-ink bg-ink p-3 shadow-[14px_14px_0_#c9ff58] transition duration-500 hover:rotate-0 motion-reduce:transform-none motion-reduce:transition-none`}>
      <div className={`relative min-h-[590px] overflow-hidden rounded-[32px] px-6 py-8 text-center ${theme.shell}`}>
        {theme.dark ? <><span aria-hidden="true" className="absolute -left-20 top-0 h-52 w-52 rounded-full bg-lime/20 blur-3xl"/><span aria-hidden="true" className="absolute -right-24 top-72 h-64 w-64 rounded-full bg-grape/20 blur-3xl"/></> : null}
        <div className="relative">
          <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full border-2 font-display text-xl font-black ${theme.dark ? "border-lime/60 bg-lime text-ink shadow-[0_0_28px_rgba(201,255,88,.28)]" : "border-ink bg-white text-ink"}`}>ML</div>
          <h2 className="mt-5 font-display text-2xl font-black">Mi MultiLinks</h2>
          <p className={`mt-2 text-sm ${theme.dark ? "text-white/60" : "opacity-65"}`}>Contenido, proyectos y comunidad</p>
          <div className="mt-7 space-y-3 text-left">
            {demoLinks.map((item) => <div key={item.title} className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${theme.dark ? "border border-white/15 bg-white/[.045] text-white shadow-[0_10px_28px_rgba(0,0,0,.28)] hover:border-lime/55" : "border-2 border-ink bg-white text-ink shadow-[3px_3px_0_#151515]"}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${theme.dark ? "border border-white/10 bg-white/[.05]" : "border-2 border-ink bg-cream"}`}><LinkFavicon url={item.url} title={item.title}/></span><span className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong><span className={`block truncate text-xs ${theme.dark ? "text-white/45" : "text-black/50"}`}>{item.subtitle}</span></span><span className="grid h-8 w-8 place-items-center rounded-full" style={{ color: theme.accent }}><ArrowUpRight size={18}/></span></div>)}
          </div>
          <div className={`mx-auto mt-7 inline-flex items-center gap-2 rounded-full px-3 py-2 font-display text-[9px] font-black uppercase tracking-[.08em] ${theme.dark ? "border border-white/15 text-white/70" : "border-2 border-current opacity-70"}`}><Check size={13} style={{ color: theme.accent }}/> Hecho con MultiLinks</div>
        </div>
      </div>
    </div>
  </div>;
}
