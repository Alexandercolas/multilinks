import Link from 'next/link';
import { Check, Crown, Minus } from 'lucide-react';
import { ProCheckout } from '@/components/billing/pro-checkout';
import { ProActivationStatus } from '@/components/billing/pro-activation-status';
import { PremiumBanner } from '@/components/premium/premium-banner';
import { Logo } from '@/components/logo';
import { createClient } from '@/lib/supabase/server';
import type { AccountAccess } from '@/lib/premium-access';
export const metadata={title:'Free y Premium',description:'30 días de Premium completo, luego Free o Premium por US$3.50 al mes.'};
const comparison=[
  {feature:'Enlaces publicados',free:'1',premium:'Ilimitados'},
  {feature:'Enlaces adicionales guardados',free:true,premium:true},
  {feature:'Smart Media',free:'Enlace básico',premium:'Tarjetas y reproductores'},
  {feature:'Analytics',free:'7 días y Top Links',premium:'Historial, campañas y CSV'},
  {feature:'Fondos propios y portada',free:false,premium:true},
  {feature:'Temas y fondos premium',free:'3 fondos de regalo',premium:'Todos los disponibles'},
  {feature:'Colores, foto, bio, secciones e íconos',free:true,premium:true},
  {feature:'QR de tu perfil',free:true,premium:true},
  {feature:'Marca MultiLinks',free:'Visible',premium:'Oculta'},
];
function Value({value}:{value:string|boolean}){return typeof value==='string'?<span className="text-sm font-semibold">{value}</span>:value?<Check size={17} className="inline text-lime" aria-label="Incluido"/>:<Minus size={17} className="inline text-white/30" aria-label="No incluido"/>;}
export default async function PlansPage({searchParams}:{searchParams:Promise<{checkout?:string}>}) {
  const client=await createClient();const {data:{user}}=await client.auth.getUser();
  const {data:plan}=await client.from('plans').select('price_monthly').eq('id','pro').maybeSingle();
  const access:AccountAccess|null=user?(await client.rpc('account_access')).data:null;
  const params=await searchParams;const subscribed=access?.source==='subscription';
  const price=access?.price_monthly??plan?.price_monthly??350;
  return <main className="min-h-screen overflow-hidden bg-[#090b0d] px-4 py-8 text-white sm:px-6 sm:py-12"><div className="mx-auto max-w-5xl">
    <header className="flex items-center justify-between gap-4"><Logo/><Link href={user?'/dashboard':'/'} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold">Volver</Link></header>
    {user&&<div className="mt-8"><PremiumBanner access={access}/></div>}
    {user&&<ProActivationStatus checkoutSuccess={params.checkout==='success'} initialIsPro={subscribed&&access?.state==='PREMIUM_ACTIVE'} userId={user.id}/>}
    <section className="py-12 text-center"><p className="text-xs font-black uppercase tracking-widest text-lime">Free + Premium</p><h1 className="mt-5 font-display text-4xl font-black tracking-tight sm:text-6xl">Prueba todo MultiLinks.</h1><p className="mx-auto mt-5 max-w-2xl text-white/55">Tus primeros 30 días incluyen todas las funciones Premium, sin tarjeta. Después eliges: continuar en Free o activar Premium por US${(price/100).toFixed(2)}/mes.</p></section>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-3xl border border-white/15 bg-card p-7"><h2 className="text-xl font-black">Free</h2><p className="mt-5 text-4xl font-black">US$0</p><p className="mt-2 text-sm text-white/45">Para empezar, sin fecha de vencimiento.</p><p className="mt-6 text-sm leading-6 text-white/65">Publica un enlace, personaliza tu perfil y consulta estadísticas básicas. Tus enlaces y configuraciones adicionales permanecen guardados.</p><Link href={user?'/dashboard':'/sign-in?mode=signup'} className="mt-6 inline-block rounded-xl border border-white/20 px-5 py-3 font-bold">{user?'Ir al dashboard':'Probar Premium 30 días'}</Link></article>
      <article className="relative rounded-3xl border border-lime/40 bg-card p-7"><div className="flex items-center gap-2 text-lime"><Crown size={20}/><h2 className="text-xl font-black">Premium</h2></div><p className="mt-4 text-sm text-white/55">Más libertad, más herramientas y más datos.</p>
        {subscribed?<div className="mt-5"><p className="text-2xl font-black text-lime">Tu Premium está activo</p><a href="/api/billing/portal" className="mt-5 inline-block rounded-xl border border-white/20 px-5 py-3 font-bold">Gestionar suscripción</a></div>
          : user?<div className="mt-5"><ProCheckout userId={user.id} monthlyPrice={price} annualAvailable={Boolean(process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID)}/><p className="mt-4 text-xs leading-5 text-white/45">Activar Premium ahora inicia el cobro indicado en el checkout. La prueba inicial no requiere pago ni se renueva automáticamente.</p></div>
          : <div className="mt-6"><p className="text-4xl font-black text-lime">US${(price/100).toFixed(2)}<span className="text-sm text-white/45">/mes</span></p><Link href="/sign-in?mode=signup&next=/planes" className="mt-6 inline-block rounded-xl bg-lime px-5 py-3 font-black text-ink">Probar Premium 30 días</Link></div>}
      </article></div>
    <section className="mt-10 rounded-3xl border border-white/12 bg-card p-4 sm:p-6"><h2 className="mb-5 text-xl font-bold">Todo lo que puedes hacer</h2><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-white/10 pb-4 text-xs font-black uppercase"><span>Función</span><span className="text-center">Free</span><span className="text-center text-lime">Premium</span></div>{comparison.map(row=><div key={row.feature} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-b border-white/5 py-4"><span className="break-words text-xs text-white/70 sm:text-sm">{row.feature}</span><span className="text-center"><Value value={row.free}/></span><span className="text-center"><Value value={row.premium}/></span></div>)}</section>
    <section className="mt-8 text-sm leading-6 text-white/50"><h2 className="font-bold text-white">Qué pasa cuando termina tu prueba</h2><p className="mt-2">Sin una suscripción activa, tu cuenta continúa en Free. Publicamos el primer enlace activo según el orden de tu editor; los demás se guardan y vuelven a publicarse al reactivar Premium. No borramos tu contenido, tus fondos ni tus estadísticas.</p><p className="mt-3">Pago seguro con Lemon Squeezy. Gestiona la renovación y cancelación desde su portal. Los impuestos aplicables se muestran antes de pagar. MultiLinks no almacena datos de tarjetas.</p></section>
  </div></main>;
}
