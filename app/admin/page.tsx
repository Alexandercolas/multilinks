import Link from "next/link";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { Activity, ArrowUpRight, Flag, Home, MousePointerClick, ShieldCheck, Users } from "lucide-react";
import { AdminAudit, type AdminLogRow } from "@/components/admin/admin-audit";
import { AdminReports, type AdminReportRow } from "@/components/admin/admin-reports";
import { AdminSupport, type SupportRequestRow } from "@/components/admin/admin-support";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/admin-users-table";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

type DailyClick = { clicks: number };
type AdminMetrics = { total_users: number; active_profiles: number };
export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");

  const today = new Date().toISOString().slice(0, 10);
  const [usersResult, metricsResult, reportsResult, supportResult, clicksResult, logsResult] = await Promise.all([
    supabase.rpc("admin_user_management_page", { search_query: "", page_size: 5, page_offset: 0 }),
    supabase.rpc("admin_platform_metrics").single(),
    supabase.from("profile_reports").select("id,reason,description,status,created_at,profiles(username,display_name)").in("status", ["pending", "reviewing"]).order("created_at", { ascending: true }),
    supabase.from("support_requests").select("id,email,subject,message,status,created_at").in("status", ["open", "in_progress"]).order("created_at", { ascending: true }),
    supabase.from("link_daily_clicks").select("clicks").eq("day", today),
    supabase.rpc("admin_recent_audit", { max_rows: 100 }),
  ]);

  if (usersResult.error || metricsResult.error || reportsResult.error || supportResult.error || clicksResult.error || logsResult.error) {
    const error = usersResult.error ?? metricsResult.error ?? reportsResult.error ?? supportResult.error ?? clicksResult.error ?? logsResult.error;
    Sentry.captureException(new Error("Admin dashboard loading failed"));
    console.error("Admin dashboard loading failed", error);
    throw new Error("No se pudieron cargar los datos administrativos.");
  }

  const users = (usersResult.data ?? []) as AdminUserRow[];
  const metrics = metricsResult.data as AdminMetrics;
  const reports = (reportsResult.data ?? []) as unknown as AdminReportRow[];
  const supportRequests = (supportResult.data ?? []) as SupportRequestRow[];
  const dailyClicks = (clicksResult.data ?? []) as DailyClick[];
  const logs = (logsResult.data ?? []) as AdminLogRow[];
  const totalUsers = Number(metrics.total_users ?? 0);
  const activeProfiles = Number(metrics.active_profiles ?? 0);
  const clicksToday = dailyClicks.reduce((total, item) => total + item.clicks, 0);

  return <main className="relative min-h-screen overflow-hidden bg-[#090b0d] text-white">
    <span aria-hidden="true" className="pointer-events-none fixed -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-lime/10 blur-3xl"/>
    <span aria-hidden="true" className="pointer-events-none fixed -bottom-56 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-grape/10 blur-3xl"/>
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="relative hidden min-h-screen border-r border-white/10 bg-[#0d1014]/95 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="text-white"><Logo/></div>
        <div className="mt-8 rounded-2xl border border-white/15 bg-white/[.045] p-4 text-white shadow-[0_18px_55px_rgba(0,0,0,.28)]">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime shadow-[0_0_22px_rgba(201,255,88,.10)]"><ShieldCheck/></span><div><p className="font-display text-[10px] font-black uppercase tracking-[.13em] text-white/45">Acceso privado</p><p className="font-black text-white">Administrador</p></div></div>
        </div>
        <nav className="mt-8 space-y-2 font-display text-xs font-black"><AdminNav href="#resumen" label="Resumen"/><AdminNav href="#reportes" label="Reportes"/><AdminNav href="#soporte" label="Soporte"/><AdminNav href="#usuarios" label="Usuarios"/><AdminNav href="#actividad" label="Actividad"/></nav>
        <div className="mt-auto space-y-2 border-t border-white/10 pt-5"><Link href="/dashboard" className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/[.05] px-3 py-3 text-sm font-black text-white transition hover:border-lime/45 hover:bg-lime/10 motion-reduce:transition-none">Mi dashboard <ArrowUpRight className="text-lime" size={17}/></Link><Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white/45 transition hover:text-white motion-reduce:transition-none"><Home size={17}/> Ver inicio</Link></div>
      </aside>

      <div className="min-w-0">
        <header className="relative border-b border-white/10 bg-[#0d1014]/80 px-5 py-4 backdrop-blur-xl lg:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><div className="text-white lg:hidden"><Logo/></div><div className="hidden lg:block"><p className="font-display text-[10px] font-black uppercase tracking-[.15em] text-white/35">MultiLinks</p><p className="font-black text-white">Centro de control</p></div><span className="inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/10 px-3 py-2 font-display text-[10px] font-black text-lime"><span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_14px_#c9ff58]"/> SOLO ADMIN</span></div></header>

        <div id="resumen" className="mx-auto max-w-7xl px-5 py-9 lg:px-8 lg:py-12">
          <div className="animate-fade-up motion-reduce:animate-none"><p className="font-display text-xs font-black uppercase tracking-[.16em] text-lime">Control de la plataforma</p><h1 className="mt-3 max-w-4xl font-display text-3xl font-black leading-tight tracking-[-.04em] text-white sm:text-5xl">Todo MultiLinks,<br/><span className="text-lime">bajo control.</span></h1><p className="mt-4 max-w-2xl text-white/50">Usuarios, moderación y actividad general en un panel privado protegido por sesión y rol administrativo.</p></div>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Users/>} label="Usuarios totales" value={totalUsers} accent="bg-ink text-white" delay="80ms"/>
            <Metric icon={<Activity/>} label="Perfiles activos" value={activeProfiles} accent="bg-grape text-white" delay="140ms"/>
            <Metric icon={<MousePointerClick/>} label="Clics de hoy" value={clicksToday} accent="bg-lime text-ink" delay="200ms"/>
            <Metric icon={<Flag/>} label="Reportes pendientes" value={reports.length} accent="bg-cream text-ink" delay="260ms"/>
          </section>

          <AdminReports reports={reports}/>
          <AdminSupport requests={supportRequests}/>
          <AdminUsersTable users={users} initialTotal={totalUsers}/>

          <AdminAudit logs={logs}/>
        </div>
      </div>
    </div>
  </main>;
}

function Metric({ icon, label, value, accent, delay }: { icon: React.ReactNode; label: string; value: number; accent: string; delay: string }) {
  return <article className="animate-fade-up rounded-2xl border border-white/15 bg-[#101318]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,.28)] motion-reduce:animate-none" style={{ animationDelay: delay }}><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl border border-white/10 ${accent}`}>{icon}</span><span className="font-display text-3xl font-black text-white">{value.toLocaleString("es-DO")}</span></div><p className="mt-5 font-display text-[10px] font-black uppercase tracking-[.12em] text-white/40">{label}</p></article>;
}

function AdminNav({ href, label }: { href: string; label: string }) {
  return <a href={href} className="block border-l-2 border-transparent px-3 py-3 text-white/40 transition hover:border-lime hover:bg-white/[.04] hover:text-white motion-reduce:transition-none">{label}</a>;
}
