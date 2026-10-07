import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const timezone = url.searchParams.get("timezone") ?? "UTC";
  if (!start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end))) {
    return Response.json({ error: "Invalid range" }, { status: 400 });
  }
  const { data, error } = await client.rpc("analytics_report", { p_start: start, p_end: end, p_timezone: timezone });
  if (error) return Response.json({ error: "Unable to load analytics right now." }, { status: 503 });
  if (url.searchParams.get("format") === "csv") {
    if (!data.pro) return Response.json({ error: "Pro required" }, { status: 403 });
    const escape = (value: unknown) => `"${String(value ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [["date", "visits", "visitors", "clicks"], ...data.timeline.map((row: { bucket: string; visits: number; visitors: number; clicks: number }) => [row.bucket, row.visits, row.visitors, row.clicks])];
    return new Response("\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="multilinks-analytics.csv"', "Cache-Control": "private, no-store" } });
  }
  return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
