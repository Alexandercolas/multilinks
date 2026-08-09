"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

export function LinkFavicon({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false);
  let favicon: string | null = null;
  try { favicon = new URL("/favicon.ico", url).toString(); } catch { favicon = null; }
  if (failed || !favicon) return <Link2 size={21} aria-hidden="true"/>;
  return <img src={favicon} alt={`Logo de ${title}`} width="28" height="28" loading="lazy" className="h-7 w-7 object-contain" onError={() => setFailed(true)}/>;
}
