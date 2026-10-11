"use client";
import { CheckoutButton } from "@/components/billing/checkout-button";
export function ProCheckout({ userId }: { userId: string }) {
  return (
    <div>
      <p className="mt-5 font-display text-4xl font-black text-lime">US$3.00</p>
      <p className="mt-1 text-xs font-bold text-white/40">cada mes</p>
      <div className="mt-6">
        <CheckoutButton interval="monthly" userId={userId} />
      </div>
    </div>
  );
}
