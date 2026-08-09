"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareProfileButton({ title }: { title: string }) {
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

  return <button onClick={share} className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-white px-4 py-2 font-display text-xs font-black text-ink shadow-hard transition hover:-translate-y-0.5 hover:bg-lime">{copied ? <Check size={17}/> : <Share2 size={17}/>} {copied ? "Enlace copiado" : "Compartir"}</button>;
}
