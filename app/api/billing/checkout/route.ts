import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createProCheckout } from "@/lib/lemon-squeezy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { allowRouteRequest } from "@/lib/security/rate-limit";
import { isSameOriginRequest } from "@/lib/security/same-origin";

const requestSchema = z.object({ interval: z.enum(["monthly", "annual"]) });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  const allowed = await allowRouteRequest(request, "billing-checkout", user.id, 10, 10 * 60);
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos de pago. Espera unos minutos." }, { status: 429 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  let checkoutToken: string | null = null;
  try {
    const { data: access, error: accessError } = await supabase.rpc("account_access");
    if (accessError) throw new Error("Access unavailable");
    if (access?.source === "subscription" || access?.state === "PREMIUM_PAST_DUE") return NextResponse.json({ error: "Gestiona tu suscripción actual para evitar pagos duplicados." }, { status: 409 });
    const { data: attempt, error: reserveError } = await supabase.rpc("begin_premium_checkout", { p_interval: parsed.data.interval });
    if (reserveError) throw new Error("Checkout reservation failed");
    if (attempt.blocked || attempt.busy) return NextResponse.json({ error: "Ya tienes una suscripción o un checkout en preparación. Intenta de nuevo o gestiona tu suscripción." }, { status: 409 });
    if (attempt.url) return NextResponse.json({ url: attempt.url });
    checkoutToken = attempt.token;
    const url = await createProCheckout({ id: user.id, email: user.email }, parsed.data.interval, access.price_monthly);
    const { data: finalized, error: finalizeError } = await createAdminClient().rpc("finish_premium_checkout", { p_user: user.id, p_token: checkoutToken, p_url: url });
    if (finalizeError || finalized !== true) throw new Error("Checkout finalization failed");
    return NextResponse.json({ url });
  } catch (error) {
    if (checkoutToken) await createAdminClient().rpc("finish_premium_checkout", { p_user: user.id, p_token: checkoutToken, p_url: null });
    Sentry.captureException(new Error("Checkout creation failed"));
    console.error("Checkout creation failed", error);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Intenta nuevamente." }, { status: 503 });
  }
}
