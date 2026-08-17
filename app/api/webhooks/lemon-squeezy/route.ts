import crypto from "node:crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";

type LemonPayload = {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: { id?: string; attributes?: Record<string, unknown> };
};

function isValidSignature(body: string, signature: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(body).digest("hex"), "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function mapStatus(eventName: string, value: unknown, endsAt: unknown) {
  if (
    eventName === "subscription_cancelled" &&
    typeof endsAt === "string" &&
    new Date(endsAt).getTime() > Date.now()
  ) {
    return { planId: "pro", status: "active" };
  }
  if (value === "on_trial") return { planId: "pro", status: "trialing" };
  if (value === "active") return { planId: "pro", status: "active" };
  if (["past_due", "unpaid", "paused"].includes(String(value))) return { planId: "pro", status: "past_due" };
  return { planId: "free", status: "canceled" };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!isValidSignature(rawBody, request.headers.get("x-signature"))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  let payload: LemonPayload;
  try { payload = JSON.parse(rawBody) as LemonPayload; }
  catch { return NextResponse.json({ error: "Contenido inválido" }, { status: 400 }); }

  const eventName = payload.meta?.event_name ?? "unknown";
  const providerSubscriptionId = payload.data?.id;
  const eventId = crypto.createHash("sha256").update(rawBody).digest("hex");
  const admin = createAdminClient();
  const { data: processed } = await admin.from("billing_webhook_events").select("id").eq("id", eventId).maybeSingle();
  if (processed) return NextResponse.json({ received: true, duplicate: true });

  const attributes = payload.data?.attributes ?? {};
  let userId = payload.meta?.custom_data?.user_id;
  if (!userId && providerSubscriptionId) {
    const { data } = await admin.from("subscriptions").select("user_id").eq("provider_subscription_id", providerSubscriptionId).maybeSingle();
    userId = data?.user_id;
  }
  if (eventName.startsWith("subscription_") && userId && providerSubscriptionId) {
    const mapped = mapStatus(eventName, attributes.status, attributes.ends_at);
    const urls = attributes.urls as { customer_portal?: string; update_payment_method?: string } | undefined;
    const variantId = attributes.variant_id ? String(attributes.variant_id) : null;
    const monthlyVariant = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
    const annualVariant = process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID;
    if (!variantId || ![monthlyVariant, annualVariant].includes(variantId)) {
      return NextResponse.json({ error: "Variante desconocida" }, { status: 400 });
    }
    const { error } = await admin.from("subscriptions").upsert({
      user_id: userId,
      plan_id: mapped.planId,
      status: mapped.status,
      provider_customer_id: attributes.customer_id ? String(attributes.customer_id) : null,
      provider_subscription_id: providerSubscriptionId,
      provider_variant_id: variantId,
      billing_interval: variantId === monthlyVariant ? "monthly" : "annual",
      current_period_end: (attributes.renews_at ?? attributes.ends_at ?? null) as string | null,
      billing_portal_url: urls?.customer_portal ?? urls?.update_payment_method ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      Sentry.captureException(new Error("Subscription synchronization failed"));
      console.error("Subscription sync failed", error);
      return NextResponse.json({ error: "No se pudo sincronizar" }, { status: 500 });
    }
  }
  const { error: eventError } = await admin.from("billing_webhook_events").insert({ id: eventId, event_name: eventName });
  if (eventError) {
    Sentry.captureException(new Error("Billing webhook event registration failed"));
    console.error("Billing webhook event registration failed", eventError);
    return NextResponse.json({ error: "No se pudo registrar el evento" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
