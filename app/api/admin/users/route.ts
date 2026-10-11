import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/security/same-origin";
import { revalidatePath } from "next/cache";
import { allowRouteRequest } from "@/lib/security/rate-limit";

const querySchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin)
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const allowed = await allowRouteRequest(
    request,
    "admin-users-search",
    user.id,
    60,
    60,
  );
  if (!allowed)
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera un momento." },
      { status: 429 },
    );

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    search: url.searchParams.get("search") ?? "",
    page: url.searchParams.get("page") ?? 1,
  });
  if (!parsed.success)
    return NextResponse.json({ error: "Búsqueda inválida." }, { status: 400 });

  const pageSize = 5;
  const { data, error } = await supabase.rpc("admin_user_control_page", {
    search_query: parsed.data.search,
    page_size: pageSize,
    page_offset: (parsed.data.page - 1) * pageSize,
  });
  if (error) {
    Sentry.captureException(new Error("Admin user search failed"));
    console.error("Admin user search failed", error);
    return NextResponse.json(
      { error: "No pudimos cargar los usuarios." },
      { status: 500 },
    );
  }
  const rows = data ?? [];
  return NextResponse.json(
    {
      users: rows,
      total: Number(rows[0]?.total_count ?? 0),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const commandSchema = z.object({
  userId: z.string().uuid(),
  command: z.enum([
    "premium_on",
    "premium_off",
    "premium_reset",
    "hide_profile",
    "show_profile",
    "suspend",
    "reactivate",
  ]),
  reason: z.string().trim().min(3).max(500),
  days: z.union([z.literal(30), z.literal(90), z.literal(365), z.null()]),
});
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json(
      { error: "Solicitud no autorizada." },
      { status: 403 },
    );
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: admin, error: adminError } = await client.rpc("is_admin");
  if (adminError || !admin)
    return NextResponse.json(
      { error: "Acceso exclusivo del propietario." },
      { status: 403 },
    );
  if (!(await allowRouteRequest(request, "admin-control", user.id, 30, 60)))
    return NextResponse.json(
      { error: "Espera un momento antes de continuar." },
      { status: 429 },
    );
  const parsed = commandSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Revisa la acción, duración y motivo." },
      { status: 400 },
    );
  if (parsed.data.userId === user.id)
    return NextResponse.json(
      { error: "Tu cuenta administradora está protegida." },
      { status: 400 },
    );
  const { error } = await client.rpc("admin_control_user", {
    target_user: parsed.data.userId,
    command: parsed.data.command,
    reason: parsed.data.reason,
    days: parsed.data.days,
  });
  if (error)
    return NextResponse.json(
      {
        error:
          "No se pudo aplicar el cambio. Comprueba el perfil y vuelve a intentar.",
      },
      { status: 400 },
    );
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
  const { data: profile } = await client
    .from("profiles")
    .select("username")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (profile?.username && /^[a-z0-9_-]+$/i.test(profile.username))
    revalidatePath(`/${profile.username}`);
  return NextResponse.json({ ok: true });
}
