"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function CheckoutButton({ interval }: { interval: "monthly" | "annual" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data?.error ?? "No pudimos abrir el pago. Intenta nuevamente.");
    } catch {
      setError("No pudimos conectar con el pago. Revisa tu conexión e intenta nuevamente.");
    }
    setLoading(false);
  }
  return <div><button onClick={checkout} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(201,255,88,.20)] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">{loading ? "Abriendo pago…" : "Elegir este plan"} <ArrowUpRight size={18}/></button>{error ? <p className="mt-3 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm font-bold text-red-200">{error}</p> : null}</div>;
}
