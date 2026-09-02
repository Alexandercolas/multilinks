import Link from "next/link";
import { Check, Crown, Minus } from "lucide-react";
import { ProCheckout } from "@/components/billing/pro-checkout";
import { ProActivationStatus } from "@/components/billing/pro-activation-status";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Planes", description: "Compara los planes Gratis y Pro de MultiLinks." };

type Row = { feature: string; free: string | boolean; pro: string | boolean };

const COMPARISON: Row[] = [
  { feature: "Enlaces activos", free: "3 el primer mes, luego 1", pro: "Hasta 50" },
  { feature: "Miniaturas de YouTube", free: false, pro: true },
  { feature: "Imagen de fondo propia", free: false, pro: true },
  { feature: "Temas y fondos premium", free: "1 de regalo", pro: "Todos + Neon Dark" },
  { feature: "Colores y paletas personalizadas", free: true, pro: true },
  { feature: "Foto de perfil, secciones e íconos", free: true, pro: true },
  { feature: "Reordenar enlaces", free: true, pro: true },
  { feature: "Estadísticas de visitas y clics", free: true, pro: true },
  { feature: 'Marca "Hecho con MultiLinks"', free: "Visible", pro: "Oculta" },
  { feature: "Soporte", free: "Estándar", pro: "Prioritario" },
];

function Cell({ value, accent }: { value: string | boolean; accent?: boolean }) {
  if (value === true) {
    return (
      <span className={`inline-grid h-6 w-6 place-items-center rounded-full border ${accent ? "border-lime/30 bg-lime/10 text-lime" : "border-white/15 bg-white/[.04] text-white/60"}`}>
        <Check size={14} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full border border-white/10 text-white/25">
        <Minus size={14} />
      </span>
    );
  }
  return <span className={`text-sm font-semibold ${accent ? "text-lime" : "text-white/70"}`}>{value}</span>;
}

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = user
    ? await supabase.from("subscriptions").select("plan_id,status,billing_interval,billing_portal_url").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const subscription = result.data;
  const params = await searchParams;
  const isPro = subscription?.plan_id === "pro" && ["active", "trialing"].includes(subscription.status);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b0d] px-5 py-8 text-white sm:py-12">
      <span aria-hidden="true" className="pointer-events-none absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-lime/12 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-52 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-grape/12 blur-3xl" />
      <div className="relative mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <div className="text-white"><Logo /></div>
          <Link href={user ? "/dashboard" : "/"} className="rounded-xl border border-white/15 bg-white/[.045] px-4 py-2 text-sm font-black text-white/70 transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">Volver</Link>
        </header>

        {user ? <ProActivationStatus checkoutSuccess={params.checkout === "success"} initialIsPro={isPro} userId={user.id} /> : null}

        <section className="py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 font-display text-xs font-black uppercase tracking-[.16em] text-lime">
            <span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_14px_#c9ff58]" /> Planes simples
          </span>
          <h1 className="mt-5 font-display text-4xl font-black tracking-[-.04em] sm:text-6xl">Crece a tu <span className="text-lime">ritmo.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/50">Empieza gratis. Activa Pro cuando quieras más enlaces y un perfil sin límites de diseño.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/15 bg-[#101318]/90 p-7 shadow-[0_24px_75px_rgba(0,0,0,.30)]">
            <h2 className="font-display text-xl font-black">Gratis</h2>
            <p className="mt-4 font-display text-4xl font-black text-white">US$0</p>
            <p className="mt-1 text-xs font-bold text-white/40">para siempre</p>
            <p className="mt-6 text-sm font-semibold text-white/55">Ideal para empezar: 3 enlaces durante el primer mes y 1 enlace después, con la personalización esencial.</p>
            <Link href={user ? "/dashboard" : "/sign-in?next=/planes"} className="mt-6 inline-flex rounded-xl border border-white/15 bg-white/[.05] px-5 py-3 text-sm font-black text-white transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">
              {user ? "Ir a mi panel" : "Empezar gratis"}
            </Link>
          </article>

          <article className="relative rounded-[2rem] border border-lime/45 bg-[#101318]/95 p-7 shadow-[0_24px_85px_rgba(201,255,88,.13)]">
            <span className="absolute -top-4 right-5 inline-flex items-center gap-2 rounded-full border border-lime/35 bg-[#11150f] px-3 py-2 text-xs font-black text-lime shadow-[0_0_24px_rgba(201,255,88,.13)]">
              <Crown size={15} /> RECOMENDADO
            </span>
            <h2 className="font-display text-xl font-black">Pro</h2>
            {isPro ? (
              <div className="mt-4">
                <p className="font-display text-2xl font-black text-lime">Tu plan Pro está activo</p>
                <p className="mt-2 text-sm font-semibold text-white/60">Modalidad {subscription?.billing_interval === "annual" ? "anual" : "mensual"}.</p>
                {subscription?.billing_portal_url ? (
                  <a href={subscription.billing_portal_url} className="mt-4 inline-block rounded-xl border border-white/15 bg-white/[.05] px-4 py-2 font-black text-white transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">Administrar suscripción</a>
                ) : null}
              </div>
            ) : user ? (
              <div className="mt-4"><ProCheckout userId={user.id} /></div>
            ) : (
              <div className="mt-4">
                <p className="font-display text-4xl font-black text-lime">US$3.50</p>
                <p className="mt-1 text-xs font-bold text-white/40">al mes · o US$39.99 al año</p>
                <Link href="/sign-in?next=/planes" className="mt-6 inline-flex rounded-xl bg-lime px-6 py-3 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(201,255,88,.18)] motion-reduce:transform-none motion-reduce:transition-none">Iniciar sesión para elegir Pro</Link>
              </div>
            )}
          </article>
        </div>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/15 bg-[#101318]/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[.12em] text-white/45">
                  <th className="px-6 py-4 font-black">Qué incluye</th>
                  <th className="px-4 py-4 text-center font-black">Gratis</th>
                  <th className="px-4 py-4 text-center font-black text-lime">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-white/[.06] last:border-0">
                    <td className="px-6 py-4 text-sm font-semibold text-white/75">{row.feature}</td>
                    <td className="px-4 py-4 text-center"><Cell value={row.free} /></td>
                    <td className="px-4 py-4 text-center"><Cell value={row.pro} accent /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-center text-xs font-semibold text-white/35">Pago seguro procesado por Lemon Squeezy. MultiLinks no almacena los datos de tu tarjeta.</p>
      </div>
    </main>
  );
}
