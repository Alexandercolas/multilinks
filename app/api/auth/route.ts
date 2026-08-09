import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("login"), email: z.string().email().max(320), password: z.string().min(1).max(128) }),
  z.object({ mode: z.literal("signup"), email: z.string().email().max(320), password: z.string().min(8).max(128) }),
  z.object({ mode: z.literal("magic"), email: z.string().email().max(320) }),
]);

const limits = {
  login: { maxHits: 5, windowSeconds: 15 * 60 },
  signup: { maxHits: 3, windowSeconds: 60 * 60 },
  magic: { maxHits: 3, windowSeconds: 15 * 60 },
} as const;

function requestFingerprint(request: Request, mode: keyof typeof limits, email: string) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`${mode}:${ip}:${email.toLowerCase()}`).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 }); }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Revisa los datos enviados." }, { status: 400 });

  const { mode, email } = parsed.data;
  const limit = limits[mode];
  const admin = createAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc("check_request_rate_limit", {
    target_key: requestFingerprint(request, mode, email),
    max_hits: limit.maxHits,
    window_seconds: limit.windowSeconds,
  });

  if (limitError) return NextResponse.json({ message: "No pudimos validar el acceso. Inténtalo nuevamente." }, { status: 503 });
  if (!allowed) return NextResponse.json({ message: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." }, { status: 429 });

  const supabase = await createClient();
  const redirectTo = `${new URL(request.url).origin}/auth/callback`;

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password: parsed.data.password, options: { emailRedirectTo: redirectTo } });
    if (error) return NextResponse.json({ message: "No pudimos crear la cuenta. Verifica los datos o intenta nuevamente." }, { status: 400 });
    return NextResponse.json({ ok: true, needsEmailConfirmation: !data.session });
  }

  if (mode === "magic") {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
    if (error) return NextResponse.json({ message: "No pudimos enviar el enlace. Inténtalo nuevamente." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return NextResponse.json({ message: "Correo o contraseña incorrectos." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
