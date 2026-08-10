import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Planes", description: "Compara los planes Gratis y Pro de MultiLinks." };

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = user ? await supabase.from("subscriptions").select("plan_id,status,current_period_end,billing_interval,billing_portal_url").eq("user_id", user.id).maybeSingle() : { data: null };
  const subscription = result.data;
  const params = await searchParams;
  const isPro = subscription?.plan_id === "pro" && ["active", "trialing"].includes(subscription.status);

  return <main className="relative min-h-screen overflow-hidden bg-[#090b0d] px-5 py-8 text-white sm:py-12">
    <span aria-hidden="true" className="pointer-events-none absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-lime/12 blur-3xl"/>
    <span aria-hidden="true" className="pointer-events-none absolute -bottom-52 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-grape/12 blur-3xl"/>
    <div className="relative mx-auto max-w-6xl">
    <header className="flex items-center justify-between gap-4"><div className="text-white"><Logo/></div><Link href={user ? "/dashboard" : "/"} className="rounded-xl border border-white/15 bg-white/[.045] px-4 py-2 text-sm font-black text-white/70 transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">Volver</Link></header>
    {params.checkout === "success" ? <p className="mt-8 rounded-2xl border border-lime/30 bg-lime/10 p-4 font-black text-lime shadow-[0_16px_45px_rgba(201,255,88,.08)]">¡Pago recibido! Estamos activando tu plan. Actualiza esta página en unos segundos.</p> : null}
    <section className="py-14 text-center"><span className="inline-flex items-center gap-2 font-display text-xs font-black uppercase tracking-[.16em] text-lime"><span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_14px_#c9ff58]"/> Planes simples</span><h1 className="mt-5 font-display text-4xl font-black tracking-[-.04em] sm:text-6xl">Crece a tu <span className="text-lime">ritmo.</span></h1><p className="mx-auto mt-5 max-w-2xl text-white/50">Empieza gratis y activa Pro cuando necesites más herramientas.</p></section>
    <div className="grid gap-7 lg:grid-cols-3">
      <PlanCard title="Gratis" price="US$0" subtitle="para siempre" features={["Hasta 10 enlaces activos", "1 perfil", "3 temas básicos", "Estadísticas de 7 días", "Marca MultiLinks"]}/>
      <PlanCard title="Pro mensual" price="US$4.99" subtitle="cada mes" featured features={["Enlaces ilimitados", "Hasta 3 perfiles", "Todos los temas", "Historial completo", "Sin marca MultiLinks", "Soporte prioritario"]} action={!isPro && user ? <CheckoutButton interval="monthly"/> : undefined}/>
      <PlanCard title="Pro anual" price="US$39.99" subtitle="cada año · ahorras US$19.89" features={["Todo lo incluido en Pro", "Enlaces ilimitados", "Hasta 3 perfiles", "Historial completo", "Sin marca MultiLinks", "Mejor precio del año"]} action={!isPro && user ? <CheckoutButton interval="annual"/> : undefined}/>
    </div>
    {!user ? <div className="mt-8 text-center"><Link href="/sign-in?next=/planes" className="inline-flex rounded-xl bg-lime px-6 py-3 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(201,255,88,.18)] motion-reduce:transform-none motion-reduce:transition-none">Iniciar sesión para elegir Pro</Link></div> : null}
    {isPro ? <section className="mt-8 rounded-[2rem] border border-lime/30 bg-lime/10 p-6 text-center shadow-[0_20px_70px_rgba(201,255,88,.08)]"><p className="font-display text-xl font-black text-lime">Tu plan Pro está activo</p><p className="mt-2 text-sm font-semibold text-white/60">Modalidad {subscription.billing_interval === "annual" ? "anual" : "mensual"}.</p>{subscription.billing_portal_url ? <a href={subscription.billing_portal_url} className="mt-4 inline-block rounded-xl border border-white/15 bg-white/[.05] px-4 py-2 font-black text-white transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">Administrar suscripción</a> : null}</section> : null}
    <p className="mt-8 text-center text-xs font-semibold text-white/35">Pago seguro procesado por Lemon Squeezy. MultiLinks no almacena los datos de tu tarjeta.</p>
  </div></main>;
}

function PlanCard({ title, price, subtitle, features, featured = false, action }: { title: string; price: string; subtitle: string; features: string[]; featured?: boolean; action?: React.ReactNode }) {
  return <article className={`relative rounded-[2rem] border p-7 text-white transition motion-reduce:transition-none ${featured ? "border-lime/45 bg-[#101318]/95 shadow-[0_24px_85px_rgba(201,255,88,.13)] lg:-translate-y-3 motion-reduce:transform-none" : "border-white/15 bg-[#101318]/90 shadow-[0_24px_75px_rgba(0,0,0,.30)]"}`}>{featured ? <span className="absolute -top-4 right-5 inline-flex items-center gap-2 rounded-full border border-lime/35 bg-[#11150f] px-3 py-2 text-xs font-black text-lime shadow-[0_0_24px_rgba(201,255,88,.13)]"><Crown size={15}/> RECOMENDADO</span> : null}<h2 className="font-display text-xl font-black">{title}</h2><p className={`mt-4 font-display text-3xl font-black ${featured ? "text-lime" : "text-white"}`}>{price}</p><p className="mt-1 text-xs font-bold text-white/40">{subtitle}</p><ul className="my-7 space-y-3">{features.map(feature => <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-white/70"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${featured ? "border-lime/30 bg-lime/10 text-lime" : "border-white/15 bg-white/[.045] text-white/55"}`}><Check size={14}/></span>{feature}</li>)}</ul>{action}</article>;
}
