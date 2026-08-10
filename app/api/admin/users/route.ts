import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ search: url.searchParams.get("search") ?? "", page: url.searchParams.get("page") ?? 1 });
  if (!parsed.success) return NextResponse.json({ error: "Búsqueda inválida." }, { status: 400 });

  const pageSize = 5;
  const { data, error } = await supabase.rpc("admin_user_management_page", {
    search_query: parsed.data.search,
    page_size: pageSize,
    page_offset: (parsed.data.page - 1) * pageSize,
  });
  if (error) return NextResponse.json({ error: "No pudimos cargar los usuarios." }, { status: 500 });
  const rows = data ?? [];
  return NextResponse.json({ users: rows, total: Number(rows[0]?.total_count ?? 0) });
}
