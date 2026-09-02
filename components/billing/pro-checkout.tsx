"use client";

import { useState } from "react";
import { CheckoutButton } from "@/components/billing/checkout-button";

const OPTIONS = [
  { interval: "monthly" as const, label: "Mensual", price: "US$3.50", note: "cada mes" },
  { interval: "annual" as const, label: "Anual", price: "US$39.99", note: "cada año · ahorras US$2.01" },
];

export function ProCheckout({ userId }: { userId: string }) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const selected = OPTIONS.find((option) => option.interval === interval) ?? OPTIONS[0];

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Modalidad de pago"
        className="inline-flex rounded-xl border border-white/15 bg-white/[.04] p-1"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.interval}
            type="button"
            role="radio"
            aria-checked={interval === option.interval}
            onClick={() => setInterval(option.interval)}
            className={`rounded-lg px-4 py-2 text-sm font-black transition motion-reduce:transition-none ${interval === option.interval ? "bg-lime text-ink" : "text-white/55 hover:text-white"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-5 font-display text-4xl font-black text-lime">{selected.price}</p>
      <p className="mt-1 text-xs font-bold text-white/40">{selected.note}</p>
      <div className="mt-6">
        <CheckoutButton interval={interval} userId={userId} />
      </div>
    </div>
  );
}
