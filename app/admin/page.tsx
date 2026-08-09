import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, BarChart3, Flag, Home, MousePointerClick, ShieldCheck, Users } from "lucide-react";
import { AdminReports, type AdminReportRow } from "@/components/admin/admin-reports";
import { AdminSupport, type SupportRequestRow } from "@/components/admin/admin-support";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/admin-users-table";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

type DailyClick = { clicks: number };
type AdminLog = { id: number; target_user_id: string | null; action: string; details: Record<string, unknown>; created_at: string };

const actionLabels: Record<string, string> = {
  suspend_user: "Suspendió una cuenta",
  reactivate_user: "Reactivó una cuenta",
  review_report: "Revisó un reporte",
  dismiss_report: "Descartó un reporte",
  update_support: "Tomó una solicitud de soporte",
  close_support: "Cerró una solicitud de soporte",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");

  const today = new Date().toISOString().slice(0, 10);
  const [usersResult, reportsResult, supportResult, clicksResult, logsResult] = await Promise.all([
    supabase.rpc("admin_user_management_overview"),
    supabase.from("profile_reports").select("id,reason,description,status,created_at,profiles(username,display_name)").in("status", ["pending", "reviewing"]).order("created_at", { ascending: true }),
    supabase.from("support_requests").select("id,email,subject,message,status,created_at").in("status", ["open", "in_progress"]).order("created_at", { ascending: true }),
    supabase.from("link_daily_clicks").select("clicks").eq("day", today),
    supabase.from("admin_action_logs").select("id,target_user_id,action,details,created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  if (usersResult.error || reportsResult.error || supportResult.error || clicksResult.error || logsResult.error) {
    throw new Error("No se pudieron cargar los datos administrativos.");
  }

  const users = (usersResult.data ?? []) as AdminUserRow[];
  const reports = (reportsResult.data ?? []) as unknown as AdminReportRow[];
  const supportRequests = (supportResult.data ?? []) as SupportRequestRow[];
  const dailyClicks = (clicksResult.data ?? []) as DailyClick[];
  const logs = (logsResult.data ?? []) as AdminLog[];
  const usersById = new Map(users.map((item) => [item.id, item]));
  const activeProfiles = users.filter((item) => item.published && !item.suspended).length;
  const clicksToday = dailyClicks.reduce((total, item) => total + item.clicks, 0);

  return <main className="min-h-screen bg-cream text-ink">
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r-[3px] border-ink bg-white p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Logo/>
        <div className="mt-8 border-[3px] border-ink bg-ink p-4 text-white shadow-hard">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center border-2 border-white/30 bg-white/10 text-lime"><ShieldCheck/></span><div><p className="font-display text-[10px] font-black uppercase tracking-[.13em] text-white/55">Acceso privado</p><p className="font-black">Administrador</p></div></div>
        </div>
        <nav className="mt-8 space-y-2 font-display text-xs font-black"><AdminNav href="#resumen" label="Resumen"/><AdminNav href="#reportes" label="Reportes"/><AdminNav href="#soporte" label="Soporte"/><AdminNav href="#usuarios" label="Usuarios"/><AdminNav href="#actividad" label="Actividad"/></nav>
        <div className="mt-auto space-y-2 border-t-2 border-ink/15 pt-5"><Link href="/dashboard" className="flex items-center gap-2 border-2 border-ink bg-white px-3 py-3 text-sm font-black shadow-[3px_3px_0_#151515]">Mi dashboard <ArrowUpRight size={17}/></Link><Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm font-bold"><Home size={17}/> Ver inicio</Link></div>
      </aside>

      <div className="min-w-0">
        <header className="border-b-2 border-ink/15 bg-white px-5 py-4 lg:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><div className="lg:hidden"><Logo/></div><div className="hidden lg:block"><p className="font-display text-[10px] font-black uppercase tracking-[.15em] text-black/40">MultiLinks</p><p className="font-black">Centro de control</p></div><span className="border-2 border-ink bg-ink px-3 py-2 font-display text-[10px] font-black text-white shadow-[3px_3px_0_#151515]">SOLO ADMIN</span></div></header>

        <div id="resumen" className="mx-auto max-w-7xl px-5 py-9 lg:px-8 lg:py-12">
          <div className="animate-fade-up"><p className="font-display text-xs font-black uppercase tracking-[.16em] text-grape-dark">Control de la plataforma</p><h1 className="mt-3 max-w-4xl font-display text-3xl font-black leading-tight tracking-[-.04em] sm:text-5xl">Todo MultiLinks,<br/><span className="text-grape-dark">bajo control.</span></h1><p className="mt-4 max-w-2xl text-black/60">Usuarios, moderación y actividad general en un panel privado protegido por sesión y rol administrativo.</p></div>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Users/>} label="Usuarios totales" value={users.length} accent="bg-ink text-white" delay="80ms"/>
            <Metric icon={<Activity/>} label="Perfiles activos" value={activeProfiles} accent="bg-grape text-white" delay="140ms"/>
            <Metric icon={<MousePointerClick/>} label="Clics de hoy" value={clicksToday} accent="bg-lime text-ink" delay="200ms"/>
            <Metric icon={<Flag/>} label="Reportes pendientes" value={reports.length} accent="bg-cream text-ink" delay="260ms"/>
          </section>

          <AdminReports reports={reports}/>
          <AdminSupport requests={supportRequests}/>
          <AdminUsersTable users={users}/>

          <section id="actividad" className="mt-8 border-[3px] border-ink bg-white shadow-hard-lg">
            <div className="flex items-center gap-3 border-b-[3px] border-ink bg-ink p-5 text-white"><BarChart3/><div><p className="font-display text-xs font-black uppercase tracking-[.14em] text-lime">Auditoría</p><h2 className="font-display text-xl font-black">Actividad administrativa</h2></div></div>
            <div className="divide-y-2 divide-ink/20">{logs.map((log) => { const target = log.target_user_id ? usersById.get(log.target_user_id) : null; return <article key={log.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{actionLabels[log.action] ?? log.action}</p><p className="mt-1 text-sm text-black/55">{target?.email ?? "Cuenta no disponible"}</p></div><time className="font-display text-[10px] font-black uppercase tracking-[.1em] text-black/45">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.created_at))}</time></article>; })}</div>
            {logs.length === 0 ? <p className="p-8 text-center font-bold text-black/50">Las acciones de moderación aparecerán aquí.</p> : null}
          </section>
        </div>
      </div>
    </div>
  </main>;
}

function Metric({ icon, label, value, accent, delay }: { icon: React.ReactNode; label: string; value: number; accent: string; delay: string }) {
  return <article className="animate-fade-up border-[3px] border-ink bg-white p-5 shadow-hard" style={{ animationDelay: delay }}><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center border-2 border-ink ${accent}`}>{icon}</span><span className="font-display text-3xl font-black">{value.toLocaleString("es-DO")}</span></div><p className="mt-5 font-display text-[10px] font-black uppercase tracking-[.12em] text-black/55">{label}</p></article>;
}

function AdminNav({ href, label }: { href: string; label: string }) {
  return <a href={href} className="block border-l-[3px] border-transparent px-3 py-3 text-black/55 transition hover:border-grape-dark hover:bg-cream hover:text-ink">{label}</a>;
}
