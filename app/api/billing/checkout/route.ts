import { NextResponse } from "next/server";
import { z } from "zod";
import { createProCheckout } from "@/lib/lemon-squeezy";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ interval: z.enum(["monthly", "annual"]) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  try {
    const url = await createProCheckout({ id: user.id, email: user.email }, parsed.data.interval);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout creation failed", error);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Intenta nuevamente." }, { status: 503 });
  }
}
