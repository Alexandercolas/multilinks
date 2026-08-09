"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("suspended") === "1") {
      setMessage("Esta cuenta está suspendida. Contacta a soporte si crees que se trata de un error.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password }),
      });
      const result = await response.json() as { needsEmailConfirmation?: boolean; message?: string };
      if (!response.ok) setMessage(result.message ?? "No pudimos completar la solicitud.");
      else if (result.needsEmailConfirmation) setMessage("Revisa tu correo para confirmar la cuenta.");
      else { router.push("/dashboard"); router.refresh(); }
    } catch {
      setMessage("No pudimos conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    if (!email || !email.includes("@")) { setMessage("Escribe primero tu correo electrónico."); return; }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "magic", email }),
      });
      const result = await response.json() as { message?: string };
      setMessage(response.ok ? "Te enviamos un enlace seguro para entrar sin contraseña." : result.message ?? "No pudimos enviar el enlace.");
    } catch {
      setMessage("No pudimos conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="relative grid min-h-screen overflow-hidden bg-[#090b0d] px-5 py-10 text-white lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:px-12">
    <span className="pointer-events-none absolute -left-36 -top-36 h-[32rem] w-[32rem] rounded-full bg-lime/15 blur-3xl" aria-hidden="true"/>
    <span className="pointer-events-none absolute -bottom-48 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-grape/15 blur-3xl" aria-hidden="true"/>
    <section className="relative hidden max-w-2xl flex-col justify-between py-8 lg:flex">
      <div className="text-white"><Logo/></div>
      <div className="my-auto"><span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 py-2 font-display text-[10px] font-black uppercase tracking-[.14em] text-lime"><Sparkles size={14}/> Tu espacio digital</span><h2 className="mt-7 max-w-xl font-display text-5xl font-black leading-[1.08] tracking-[-.05em]">Todo lo tuyo.<br/><span className="text-lime">Un solo link.</span></h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/55">Crea, personaliza y comparte una página que se siente verdaderamente tuya.</p><div className="mt-10 grid max-w-lg gap-4 text-sm font-semibold text-white/70 sm:grid-cols-2"><span className="flex items-center gap-3"><Check className="text-lime" size={18}/> Perfil personalizable</span><span className="flex items-center gap-3"><Check className="text-lime" size={18}/> Estadísticas reales</span><span className="flex items-center gap-3"><Check className="text-lime" size={18}/> Enlaces protegidos</span><span className="flex items-center gap-3"><ShieldCheck className="text-lime" size={18}/> Acceso seguro</span></div></div>
      <p className="text-xs font-semibold text-white/30">MultiLinks · Tu presencia, bien presentada.</p>
    </section>
    <section className="relative m-auto w-full max-w-md rounded-[2rem] border border-white/15 bg-[#101318]/95 p-7 shadow-[0_28px_90px_rgba(0,0,0,.55)] sm:p-9">
      <div className="text-white lg:hidden"><Logo/></div>
      <span className="mt-8 inline-flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[.15em] text-lime lg:mt-0"><span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_14px_#c9ff58]"/> Acceso MultiLinks</span>
      <h1 className="mt-5 font-display text-3xl font-black tracking-[-.04em]">{mode === "login" ? "Qué bueno verte" : "Crea tu MultiLink"}</h1>
      <p className="mt-3 text-sm text-white/50">{mode === "login" ? "Entra para administrar tu página." : "Tu página pública empieza aquí."}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-bold text-white/75">Correo<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3.5 font-normal text-white outline-none transition placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"/></label>
        <label className="block text-sm font-bold text-white/75">Contraseña<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3.5 font-normal text-white outline-none transition focus:border-lime/70 focus:bg-white/[.07]"/></label>
        {message ? <p className="rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm font-semibold text-white/70">{message}</p> : null}
        <button disabled={loading} className="w-full rounded-xl bg-lime px-5 py-3.5 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(201,255,88,.18)] disabled:opacity-50">{loading ? "Procesando…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
        {mode === "login" ? <button type="button" disabled={loading} onClick={sendMagicLink} className="w-full rounded-xl border border-white/15 bg-white/[.035] px-5 py-3 font-bold text-white/75 transition hover:border-white/30 hover:text-white disabled:opacity-50">Entrar con enlace al correo</button> : null}
      </form>
      {mode === "login" ? <Link href="/forgot-password" className="mt-4 block text-center text-sm font-bold text-lime/80 hover:text-lime">¿Olvidaste tu contraseña?</Link> : null}
      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="mt-5 w-full text-sm font-bold text-white/60 hover:text-white">{mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}</button>
      <Link href="/" className="mt-5 block text-center text-xs font-semibold text-white/30 hover:text-white/60">Volver al inicio</Link>
    </section>
  </main>;
}
