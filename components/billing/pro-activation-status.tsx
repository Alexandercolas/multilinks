"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

type ProActivationStatusProps = {
  checkoutSuccess: boolean;
  initialIsPro: boolean;
  userId: string;
};

export function ProActivationStatus({
  checkoutSuccess,
  initialIsPro,
  userId,
}: ProActivationStatusProps) {
  const router = useRouter();
  const [isPro, setIsPro] = useState(initialIsPro);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const previousIsPro = useRef(initialIsPro);

  useEffect(() => {
    if (!checkoutSuccess) return;
    const pendingUserId = window.sessionStorage.getItem(
      "multilinks:pro-checkout-pending",
    );
    const checkoutStartedHere = pendingUserId === userId;

    if (initialIsPro && !checkoutStartedHere) return;

    previousIsPro.current = false;
    setHasPendingCheckout(true);
  }, [checkoutSuccess, initialIsPro, userId]);

  useEffect(() => {
    if (!checkoutSuccess || !hasPendingCheckout || isPro) return;

    const supabase = createClient();
    const startedAt = Date.now();
    let cancelled = false;

    async function verifySubscription() {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_id,status")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;
      const active =
        data?.plan_id === "pro" &&
        ["active", "trialing"].includes(data.status);

      if (active) {
        setIsPro(true);
        return;
      }

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }

      window.setTimeout(verifySubscription, POLL_INTERVAL_MS);
    }

    void verifySubscription();
    return () => {
      cancelled = true;
    };
  }, [checkoutSuccess, hasPendingCheckout, isPro, userId]);

  useEffect(() => {
    if (!hasPendingCheckout) return;

    let cancelled = false;
    if (!previousIsPro.current && isPro) {
      async function claimWelcome() {
        const { data: claimed } = await createClient().rpc(
          "claim_pro_welcome",
        );
        if (cancelled) return;

        if (claimed === true) {
          setShowWelcome(true);
        } else {
          router.refresh();
        }
        window.sessionStorage.removeItem("multilinks:pro-checkout-pending");
        setHasPendingCheckout(false);
      }
      void claimWelcome();
    }
    previousIsPro.current = isPro;
    return () => {
      cancelled = true;
    };
  }, [hasPendingCheckout, isPro, router]);

  useEffect(() => {
    if (!showWelcome) return;
    const timeout = window.setTimeout(() => {
      setShowWelcome(false);
      router.refresh();
    }, 6_000);
    return () => window.clearTimeout(timeout);
  }, [router, showWelcome]);

  if (showWelcome) {
    return (
      <div
        role="status"
        className="mt-8 flex animate-fade-up items-start gap-3 rounded-2xl border border-lime/30 bg-lime/10 p-4 text-lime shadow-[0_16px_45px_rgba(201,255,88,.08)] motion-reduce:animate-none"
      >
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime text-ink">
          <Check size={14} strokeWidth={3} />
        </span>
        <div>
          <p className="font-display text-sm font-black text-white">
            Bienvenido a MultiLinks Pro
          </p>
          <p className="mt-1 text-sm font-semibold text-white/55">
            Ya tienes hasta 50 enlaces activos y todo el diseño premium disponible.
          </p>
        </div>
      </div>
    );
  }

  if (checkoutSuccess && hasPendingCheckout && !isPro) {
    return (
      <div
        role="status"
        className="mt-8 rounded-2xl border border-white/15 bg-white/[.035] p-4"
      >
        <p className="font-display text-sm font-black text-white">
          {timedOut ? "Tu pago sigue procesándose" : "Verificando tu pago…"}
        </p>
        <p className="mt-1 text-sm font-semibold text-white/45">
          {timedOut
            ? "Esto está tardando más de lo normal. Tu pago se procesó correctamente y tu cuenta Pro se activará en los próximos minutos. Puedes seguir usando MultiLinks mientras tanto."
            : "Lemon Squeezy ya nos devolvió al sitio. Estamos confirmando la activación de Pro."}
        </p>
        {timedOut ? (
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-xl bg-lime px-4 py-2.5 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] motion-reduce:transform-none motion-reduce:transition-none"
          >
            Ir al dashboard
          </Link>
        ) : null}
      </div>
    );
  }

  return null;
}
