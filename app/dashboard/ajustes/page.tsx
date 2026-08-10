"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CreditCard, ExternalLink, HelpCircle, KeyRound, LifeBuoy, LockKeyhole, LogOut, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/sign-in?next=/dashboard/ajustes"); return; }
      setEmail(data.user.email ?? "");
      setReady(true);
    });
  }, [router]);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    if (confirmation !== "ELIMINAR") return;
    if (!window.confirm("Esta acción eliminará permanentemente tu cuenta, perfil, enlaces y estadísticas. ¿Deseas continuar?")) return;
    setDeleting(true);
    setMessage("");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setMessage(result.error ?? "No pudimos eliminar la cuenta."); setDeleting(false); return; }
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#090b0d] text-white"><p className="font-bold text-white/50">Cargando ajustes…</p></main>;

  return <main className="relative min-h-screen overflow-hidden bg-[#090b0d] text-white">
    <span aria-hidden="true" className="pointer-events-none fixed -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-lime/10 blur-3xl"/>
    <span aria-hidden="true" className="pointer-events-none fixed -bottom-56 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-grape/10 blur-3xl"/>
    <header className="relative flex min-h-20 items-center justify-between border-b border-white/10 bg-[#0d1014]/80 px-4 py-3 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-3"><Link href="/" className="text-white" aria-label="Inicio"><Logo/></Link><span className="hidden h-7 w-px bg-white/15 sm:block"/><span className="font-display text-xs font-black uppercase tracking-[.14em] text-lime">Ajustes</span></div><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.045] px-4 py-2 text-sm font-bold text-white/70 transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none"><ArrowLeft size={17}/> Dashboard</Link></header>
    <div className="relative mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div><p className="font-display text-xs font-black uppercase tracking-[.16em] text-lime">TU CUENTA</p><h1 className="mt-2 font-display text-3xl font-black tracking-[-.04em] sm:text-5xl">Configuración y seguridad</h1><p className="mt-4 max-w-2xl text-white/50">Administra el acceso, la ayuda y las preferencias principales de tu cuenta MultiLinks.</p></div>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <SettingsCard icon={<UserRound size={21}/>} title="Cuenta" description="Tu identidad y sesión actual.">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4"><Mail className="mt-0.5 shrink-0 text-lime" size={18}/><div className="min-w-0"><p className="text-xs font-bold text-white/35">Correo de acceso</p><p className="mt-1 break-all text-sm font-bold text-white/80">{email}</p></div></div>
          <button onClick={signOut} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white motion-reduce:transition-none"><LogOut size={16}/> Cerrar sesión</button>
        </SettingsCard>

        <SettingsCard icon={<LockKeyhole size={21}/>} title="Seguridad" description="Protege el acceso a tu perfil.">
          <div className="space-y-3 text-sm text-white/55"><p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-lime" size={18}/> La sesión y los datos privados se validan con Supabase.</p><p className="flex items-start gap-3"><KeyRound className="mt-0.5 shrink-0 text-lime" size={18}/> Usa una contraseña única que no compartas con otros servicios.</p></div>
          <Link href="/forgot-password" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-black text-ink">Cambiar contraseña <ExternalLink size={15}/></Link>
        </SettingsCard>

        <SettingsCard icon={<LifeBuoy size={21}/>} title="Soporte" description="Ayuda cuando la necesites.">
          <div className="grid gap-3 sm:grid-cols-2"><SettingsLink href="/ayuda" icon={<HelpCircle size={18}/>} label="Centro de ayuda"/><SettingsLink href="/ayuda#contacto" icon={<LifeBuoy size={18}/>} label="Contactar soporte"/></div>
          <p className="mt-4 text-sm leading-6 text-white/40">Consulta preguntas frecuentes o envíanos un mensaje si tienes problemas con tu cuenta, perfil o pago.</p>
        </SettingsCard>

        <SettingsCard icon={<CreditCard size={21}/>} title="Plan y documentos" description="Facturación, privacidad y condiciones.">
          <div className="grid gap-3 sm:grid-cols-2"><SettingsLink href="/planes" icon={<CreditCard size={18}/>} label="Planes y pagos"/><SettingsLink href="/privacidad" icon={<BookOpen size={18}/>} label="Privacidad"/></div>
          <Link href="/terminos" className="mt-4 inline-flex text-sm font-bold text-white/50 hover:text-lime">Ver Términos de Servicio →</Link>
        </SettingsCard>
      </div>

      <section className="mt-6 rounded-[2rem] border border-red-300/20 bg-[#101318]/95 p-6 shadow-[0_24px_75px_rgba(0,0,0,.30)] sm:p-8"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-300/20 bg-red-300/10 text-red-200"><Trash2 size={20}/></span><div className="min-w-0 flex-1"><h2 className="font-display text-lg font-black">Zona de peligro</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Eliminar tu cuenta borra permanentemente tu perfil, enlaces, estadísticas y acceso. Si tienes una suscripción activa, cancélala primero desde Planes.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={confirmation} onChange={event => setConfirmation(event.target.value.toUpperCase())} placeholder="Escribe ELIMINAR" aria-label="Confirmación para eliminar la cuenta" className="rounded-xl border border-red-300/20 bg-white/[.035] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-red-300/60"/><button onClick={deleteAccount} disabled={deleting || confirmation !== "ELIMINAR"} className="rounded-xl border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-300/15 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none">{deleting ? "Eliminando…" : "Eliminar mi cuenta"}</button></div>{message ? <p className="mt-3 text-sm font-bold text-red-200">{message}</p> : null}</div></div></section>
    </div>
  </main>;
}

function SettingsCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-white/15 bg-[#101318]/95 p-6 shadow-[0_24px_75px_rgba(0,0,0,.30)]"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime">{icon}</span><div><h2 className="font-display text-base font-black">{title}</h2><p className="mt-1 text-xs text-white/35">{description}</p></div></div><div className="mt-5">{children}</div></section>;
}

function SettingsLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4 text-sm font-bold text-white/70 transition hover:border-lime/40 hover:text-lime motion-reduce:transition-none"><span className="text-lime">{icon}</span>{label}</Link>;
}
