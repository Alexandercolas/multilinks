import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { allowRouteRequest } from "@/lib/security/rate-limit";
import { isSameOriginRequest } from "@/lib/security/same-origin";

const requestSchema = z.object({ confirmation: z.literal("ELIMINAR") });

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  const allowed = await allowRouteRequest(request, "account-delete", user.id, 3, 60 * 60);
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos. Espera antes de volver a intentarlo." }, { status: 429 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe ELIMINAR para confirmar." }, { status: 400 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (subscription && ["active", "trialing", "past_due"].includes(subscription.status)) {
    return NextResponse.json({ error: "Cancela primero tu suscripción desde Planes antes de eliminar la cuenta." }, { status: 409 });
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    Sentry.captureException(new Error("Account deletion failed"));
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "No pudimos eliminar la cuenta. Contacta a soporte." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
