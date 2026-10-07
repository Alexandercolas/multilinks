import Link from 'next/link';
import { Crown } from 'lucide-react';
import { premiumCta, premiumPrice, type AccountAccess } from '@/lib/premium-access';
const date=(value:string)=>new Date(value).toLocaleDateString('es-DO',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Santo_Domingo'});
export function PremiumBanner({access}: {access:AccountAccess|null}) {
  if(!access) return <div role="status" className="rounded-2xl border border-white/10 bg-card p-5 text-sm text-white/50">No pudimos consultar tu plan. Actualiza para reintentar; tu contenido se conserva.</div>;
  const trial=access.source==='trial';const managing=access.source==='subscription';
  const title=trial ? 'PREMIUM TRIAL · 30 días de acceso completo' : access.has_premium ? 'MULTILINKS PREMIUM' : 'MULTILINKS FREE';
  const message=trial ? access.days_remaining===1 ? 'Tu acceso Premium termina en menos de 24 horas.' : (access.days_remaining??30)<=7 ? `Tu acceso Premium termina en ${access.days_remaining} días.` : 'Estás disfrutando de todas las funcionalidades Premium durante tus primeros 30 días.'
    : access.state==='PREMIUM_PAST_DUE' ? 'Hay un problema con tu pago. Actualiza tu método de pago para mantener Premium.'
    : access.state==='PREMIUM_CANCELED' ? 'Cancelaste la renovación. Premium continúa activo hasta la fecha indicada.'
    : access.has_premium ? 'Tienes acceso completo a las herramientas Premium.'
    : access.state==='PREMIUM_EXPIRED' ? 'Tu Premium terminó. Tu página continúa en Free y todo tu contenido permanece guardado.'
    : access.trial_ends_at ? 'Tu prueba Premium terminó. Tu página sigue activa en Free, con un enlace publicado. Tu contenido Premium permanece guardado.'
    : 'Tu página funciona en Free con un enlace publicado y estadísticas básicas.';
  return <section aria-label="Estado de tu plan" className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-lime/25 bg-lime/[.06] p-5 sm:flex-row sm:items-start">
    <div className="min-w-0 flex-1"><h2 className="flex items-center gap-2 text-sm font-black text-lime"><Crown size={18}/>{title}</h2><p className="mt-2 text-sm text-white/70">{message}</p>
      {access.access_ends_at && <p className="mt-2 text-xs text-white/50">{trial?'Fecha de expiración':'Acceso vigente hasta'}: {date(access.access_ends_at)}.</p>}
      {trial && <p className="mt-2 text-xs text-white/45">Sin tarjeta y sin cobro automático. Después continúas en Free si no contratas Premium.</p>}
    </div>
    {managing ? <a href="/api/billing/portal" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold">Gestionar suscripción</a>
      : access.source!=='admin' && <Link href="/planes" className="rounded-xl bg-lime px-4 py-2.5 text-sm font-black text-ink">{premiumCta(access)} · {premiumPrice(access.price_monthly)}</Link>}
  </section>;
}
