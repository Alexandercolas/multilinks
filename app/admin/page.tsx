import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CreditCard, Eye, Link2, TrendingUp, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

type AdminUser = { id: string; email: string; created_at: string; username: string | null; display_name: string | null; plan_name: string; subscription_status: string };
type Profile = { id: string; username: string | null; display_name: string | null };
type DailyView = { profile_id: string; day: string; views: number };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/dashboard");

  const [{ data: users }, { data: links }, { data: views }, { data: profiles }, { data: plans }] = await Promise.all([
    supabase.rpc("admin_user_overview"),
    supabase.from("links").select("id,clicks"),
    supabase.from("profile_daily_views").select("profile_id,day,views").order("day", { ascending: false }),
    supabase.from("profiles").select("id,username,display_name"),
    supabase.from("plans").select("id,name,description,price_monthly,features").order("price_monthly"),
  ]);

  const allUsers = (users ?? []) as AdminUser[];
  const allViews = (views ?? []) as DailyView[];
  const allProfiles = (profiles ?? []) as Profile[];
  const totalClicks = (links ?? []).reduce((total, item) => total + item.clicks, 0);
  const totalViews = allViews.reduce((total, item) => total + item.views, 0);
  const publishedProfiles = allUsers.filter((item) => item.username).length;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const daysAgo = (days: number) => { const date = new Date(today); date.setUTCDate(date.getUTCDate() - (days - 1)); return date.toISOString().slice(0, 10); };
  const viewsToday = allViews.filter((item) => item.day === todayKey).reduce((total, item) => total + item.views, 0);
  const views7Days = allViews.filter((item) => item.day >= daysAgo(7)).reduce((total, item) => total + item.views, 0);
  const views30Days = allViews.filter((item) => item.day >= daysAgo(30)).reduce((total, item) => total + item.views, 0);
  const viewsByProfile = allProfiles.map((profile) => ({
    ...profile,
    total: allViews.filter((item) => item.profile_id === profile.id).reduce((sum, item) => sum + item.views, 0),
    last30: allViews.filter((item) => item.profile_id === profile.id && item.day >= daysAgo(30)).reduce((sum, item) => sum + item.views, 0),
    today: allViews.filter((item) => item.profile_id === profile.id && item.day === todayKey).reduce((sum, item) => sum + item.views, 0),
  })).sort((a, b) => b.total - a.total);

  return <main className="min-h-screen bg-[#f2efe7] text-ink">
    <header className="flex h-20 items-center justify-between border-b border-black/10 bg-white px-5 lg:px-8"><Logo/><div className="flex items-center gap-3"><span className="rounded-full bg-lime px-4 py-2 text-xs font-black">SOLO ADMIN</span><Link href="/dashboard" className="rounded-full border border-black/15 px-4 py-2 text-sm font-bold">Mi dashboard</Link></div></header>
    <div className="mx-auto max-w-7xl px-5 py-9">
      <p className="text-sm font-black text-[#7055e8]">CONTROL DE LA PLATAFORMA</p><h1 className="mt-1 text-4xl font-black tracking-tight">Panel administrativo</h1><p className="mt-2 text-black/55">Resumen privado de MultiLinks. Ningún usuario normal puede abrir esta página.</p>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Users/>} label="Usuarios" value={allUsers.length}/><Metric icon={<Link2/>} label="Perfiles publicados" value={publishedProfiles}/><Metric icon={<Eye/>} label="Visitas históricas" value={totalViews}/><Metric icon={<BarChart3/>} label="Clics" value={totalClicks}/></section>

      <section className="mt-7 rounded-3xl bg-[#8566ff] p-6 text-white shadow-sm"><div className="flex items-center gap-2"><TrendingUp size={22}/><h2 className="text-xl font-black">Visitas generales</h2></div><p className="mt-1 text-sm text-white/70">Actividad acumulada de todos los perfiles de la plataforma.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><VisitPeriod label="Hoy" value={viewsToday}/><VisitPeriod label="Últimos 7 días" value={views7Days}/><VisitPeriod label="Últimos 30 días" value={views30Days}/></div></section>

      <section className="mt-7 overflow-hidden rounded-3xl bg-white shadow-sm"><div className="border-b border-black/10 px-6 py-5"><h2 className="text-xl font-black">Visitas por perfil</h2><p className="mt-1 text-sm text-black/50">De mayor a menor cantidad de visitas.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-black/[.03] text-xs uppercase text-black/45"><tr><th className="px-6 py-4">Perfil</th><th className="px-6 py-4">Hoy</th><th className="px-6 py-4">Últimos 30 días</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Página</th></tr></thead><tbody>{viewsByProfile.map((profile) => <tr key={profile.id} className="border-t border-black/5"><td className="px-6 py-4"><p className="font-bold">{profile.display_name || profile.username || "Sin nombre"}</p><p className="text-xs text-black/45">{profile.username ? `@${profile.username}` : "Sin publicar"}</p></td><td className="px-6 py-4 font-bold">{profile.today.toLocaleString("es-DO")}</td><td className="px-6 py-4 font-bold">{profile.last30.toLocaleString("es-DO")}</td><td className="px-6 py-4 text-lg font-black">{profile.total.toLocaleString("es-DO")}</td><td className="px-6 py-4">{profile.username ? <Link href={`/${profile.username}`} target="_blank" className="font-bold text-[#7055e8] hover:underline">Ver perfil</Link> : <span className="text-black/35">No disponible</span>}</td></tr>)}</tbody></table></div></section>

      <section className="mt-7 overflow-hidden rounded-3xl bg-white shadow-sm"><div className="border-b border-black/10 px-6 py-5"><h2 className="text-xl font-black">Usuarios registrados</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-black/[.03] text-xs uppercase text-black/45"><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Correo</th><th className="px-6 py-4">Plan</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Registro</th></tr></thead><tbody>{allUsers.map(item => <tr key={item.id} className="border-t border-black/5"><td className="px-6 py-4 font-bold">{item.username ? `@${item.username}` : "Sin publicar"}</td><td className="px-6 py-4">{item.email}</td><td className="px-6 py-4"><span className="rounded-full bg-lime px-3 py-1 text-xs font-black">{item.plan_name}</span></td><td className="px-6 py-4 capitalize">{item.subscription_status}</td><td className="px-6 py-4 text-black/50">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(item.created_at))}</td></tr>)}</tbody></table></div></section>

      <section className="mt-7"><div className="mb-4 flex items-center gap-2"><CreditCard size={22}/><h2 className="text-xl font-black">Planes preparados</h2></div><div className="grid gap-4 md:grid-cols-2">{(plans ?? []).map(plan => <article key={plan.id} className="rounded-3xl border border-black/10 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-black">{plan.name}</h3><p className="mt-2 text-sm text-black/55">{plan.description}</p></div><p className="text-2xl font-black">{plan.price_monthly === 0 ? "Gratis" : `$${(plan.price_monthly / 100).toFixed(2)}`}<span className="text-xs text-black/40">/mes</span></p></div><ul className="mt-5 space-y-2 text-sm font-semibold">{(plan.features as string[]).map(feature => <li key={feature}>✓ {feature}</li>)}</ul></article>)}</div><p className="mt-3 text-xs text-black/45">Los planes están listos en la base de datos. Los cobros permanecerán desactivados hasta conectar y configurar un proveedor de pagos.</p></section>
    </div>
  </main>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article className="flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8566ff] text-white">{icon}</span><div><p className="text-3xl font-black">{value.toLocaleString("es-DO")}</p><p className="text-xs font-bold text-black/45">{label}</p></div></article>; }
function VisitPeriod({ label, value }: { label: string; value: number }) { return <article className="rounded-2xl bg-white/15 p-4"><p className="text-3xl font-black">{value.toLocaleString("es-DO")}</p><p className="mt-1 text-xs font-bold text-white/70">{label}</p></article>; }
