import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/security/same-origin";
import { allowRouteRequest } from "@/lib/security/rate-limit";

const schema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    password: z.string().min(8).max(128),
    confirm: z.string().max(128),
  })
  .refine(
    (value) =>
      value.password === value.confirm &&
      value.password !== value.currentPassword,
  );

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json(
      { error: "Origen no autorizado." },
      { status: 403 },
    );
  try {
    const client = await createClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user?.email)
      return NextResponse.json(
        { error: "Tu sesión expiró. Vuelve a iniciar sesión." },
        { status: 401 },
      );
    if (
      !(await allowRouteRequest(
        request,
        "account-password",
        user.id,
        5,
        15 * 60,
      ))
    )
      return NextResponse.json(
        {
          error:
            "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
        },
        { status: 429 },
      );
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Usa una contraseña nueva de 8 a 128 caracteres y confirma que ambas coincidan.",
        },
        { status: 400 },
      );
    const { data: verified, error: verificationError } =
      await client.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.currentPassword,
      });
    if (verificationError || verified.user?.id !== user.id)
      return NextResponse.json(
        { error: "La contraseña actual no es correcta." },
        { status: 400 },
      );
    const { error: updateError } = await client.auth.updateUser({
      password: parsed.data.password,
    });
    if (updateError)
      return NextResponse.json(
        {
          error:
            updateError.code === "weak_password"
              ? "Elige una contraseña más segura; esta no cumple los requisitos de tu cuenta."
              : "No pudimos cambiar la contraseña. Inténtalo nuevamente o usa la recuperación por correo.",
        },
        { status: 400 },
      );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No pudimos conectar con el servicio. Inténtalo nuevamente." },
      { status: 503 },
    );
  }
}
