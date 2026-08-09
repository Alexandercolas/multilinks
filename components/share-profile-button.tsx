"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareProfileButton({ title, dark = false }: { title: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = { title, text: `Mira el perfil de ${title} en MultiLinks`, url: window.location.href };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <button onClick={share} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-black transition hover:-translate-y-0.5 ${dark ? "border border-white/15 bg-white/[.06] text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] hover:border-lime hover:text-lime" : "border-[3px] border-ink bg-white text-ink shadow-hard hover:bg-lime"}`}>{copied ? <Check size={17}/> : <Share2 size={17}/>} {copied ? "Enlace copiado" : "Compartir"}</button>;
}
