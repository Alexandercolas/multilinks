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

  return <button onClick={share} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-black transition hover:-translate-y-0.5 ${dark ? "border border-white/15 bg-white/[.06] text-white hover:border-lime/50 hover:text-lime" : "border border-ink/10 bg-white text-ink shadow-[0_1px_2px_rgba(21,21,21,.04),0_10px_28px_-14px_rgba(21,21,21,.2)] hover:border-ink/20"}`}>{copied ? <Check size={15}/> : <Share2 size={15}/>} {copied ? "Enlace copiado" : "Compartir"}</button>;
}
