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

  return <main className="min-h-screen bg-cream px-5 py-8 sm:py-12"><div className="mx-auto max-w-6xl">
    <header className="flex items-center justify-between gap-4"><Logo/><Link href={user ? "/dashboard" : "/"} className="border-2 border-ink bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#151515]">Volver</Link></header>
    {params.checkout === "success" ? <p className="mt-8 border-[3px] border-ink bg-lime p-4 font-black shadow-hard">¡Pago recibido! Estamos activando tu plan. Actualiza esta página en unos segundos.</p> : null}
    <section className="py-14 text-center"><p className="font-display text-xs font-black uppercase tracking-[.16em] text-grape-dark">Planes simples</p><h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">Crece a tu ritmo.</h1><p className="mx-auto mt-5 max-w-2xl text-black/60">Empieza gratis y activa Pro cuando necesites más herramientas.</p></section>
    <div className="grid gap-7 lg:grid-cols-3">
      <PlanCard title="Gratis" price="US$0" subtitle="para siempre" features={["Hasta 10 enlaces activos", "1 perfil", "3 temas básicos", "Estadísticas de 7 días", "Marca MultiLinks"]}/>
      <PlanCard title="Pro mensual" price="US$4.99" subtitle="cada mes" featured features={["Enlaces ilimitados", "Hasta 3 perfiles", "Todos los temas", "Historial completo", "Sin marca MultiLinks", "Soporte prioritario"]} action={!isPro && user ? <CheckoutButton interval="monthly"/> : undefined}/>
      <PlanCard title="Pro anual" price="US$39.99" subtitle="cada año · ahorras US$19.89" features={["Todo lo incluido en Pro", "Enlaces ilimitados", "Hasta 3 perfiles", "Historial completo", "Sin marca MultiLinks", "Mejor precio del año"]} action={!isPro && user ? <CheckoutButton interval="annual"/> : undefined}/>
    </div>
    {!user ? <div className="mt-8 text-center"><Link href="/sign-in?next=/planes" className="inline-flex rounded-full border-[3px] border-ink bg-lime px-6 py-3 font-black shadow-hard">Iniciar sesión para elegir Pro</Link></div> : null}
    {isPro ? <section className="mt-8 border-[3px] border-ink bg-lime p-6 text-center shadow-hard"><p className="font-display text-xl font-black">Tu plan Pro está activo</p><p className="mt-2 text-sm font-semibold">Modalidad {subscription.billing_interval === "annual" ? "anual" : "mensual"}.</p>{subscription.billing_portal_url ? <a href={subscription.billing_portal_url} className="mt-4 inline-block border-2 border-ink bg-white px-4 py-2 font-black shadow-[3px_3px_0_#151515]">Administrar suscripción</a> : null}</section> : null}
    <p className="mt-8 text-center text-xs font-semibold text-black/45">Pago seguro procesado por Lemon Squeezy. MultiLinks no almacena los datos de tu tarjeta.</p>
  </div></main>;
}

function PlanCard({ title, price, subtitle, features, featured = false, action }: { title: string; price: string; subtitle: string; features: string[]; featured?: boolean; action?: React.ReactNode }) {
  return <article className={`relative border-[3px] border-ink p-7 shadow-hard-lg ${featured ? "bg-grape text-white" : "bg-white"}`}>{featured ? <span className="absolute -top-5 right-5 inline-flex items-center gap-2 border-2 border-ink bg-lime px-3 py-2 text-xs font-black text-ink shadow-hard"><Crown size={15}/> RECOMENDADO</span> : null}<h2 className="font-display text-xl font-black">{title}</h2><p className="mt-4 font-display text-3xl font-black">{price}</p><p className={`mt-1 text-xs font-bold ${featured ? "text-white/65" : "text-black/45"}`}>{subtitle}</p><ul className="my-7 space-y-3">{features.map(feature => <li key={feature} className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-lime text-ink"><Check size={14}/></span>{feature}</li>)}</ul>{action}</article>;
}
