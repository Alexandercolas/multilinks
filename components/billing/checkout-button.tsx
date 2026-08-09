"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function CheckoutButton({ interval }: { interval: "monthly" | "annual" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function checkout() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interval }) });
    const data = await response.json();
    if (response.ok && data.url) window.location.assign(data.url);
    else { setError(data.error ?? "No pudimos abrir el pago."); setLoading(false); }
  }
  return <div><button onClick={checkout} disabled={loading} className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-lime px-6 py-3 font-black text-ink shadow-hard transition hover:-translate-y-1 disabled:cursor-wait disabled:opacity-60">{loading ? "Abriendo pago…" : "Elegir este plan"} <ArrowUpRight size={18}/></button>{error ? <p className="mt-3 text-sm font-bold text-red-200">{error}</p> : null}</div>;
}
