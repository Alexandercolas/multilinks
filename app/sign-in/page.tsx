"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  return <main className="grid min-h-screen place-items-center bg-cream px-5 py-12">
    <section className="w-full max-w-md rounded-[32px] border-[3px] border-ink bg-white p-7 shadow-hard-lg sm:p-9">
      <Logo/>
      <h1 className="mt-8 text-4xl font-black tracking-tight">{mode === "login" ? "Qué bueno verte" : "Crea tu MultiLink"}</h1>
      <p className="mt-2 text-sm text-black/55">{mode === "login" ? "Entra para administrar tu página." : "Tu página pública empieza aquí."}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-bold">Correo<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>
        <label className="block text-sm font-bold">Contraseña<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>
        {message ? <p className="rounded-xl bg-black/5 px-4 py-3 text-sm font-semibold">{message}</p> : null}
        <button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3.5 font-bold text-white disabled:opacity-50">{loading ? "Procesando…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
        {mode === "login" ? <button type="button" disabled={loading} onClick={sendMagicLink} className="w-full rounded-full border-2 border-ink bg-white px-5 py-3 font-bold text-ink disabled:opacity-50">Entrar con enlace al correo</button> : null}
      </form>
      {mode === "login" ? <Link href="/forgot-password" className="mt-4 block text-center text-sm font-bold text-[#5f45d6]">¿Olvidaste tu contraseña?</Link> : null}
      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="mt-5 w-full text-sm font-bold text-[#5f45d6]">{mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}</button>
      <Link href="/" className="mt-5 block text-center text-xs font-semibold text-black/45">Volver al inicio</Link>
    </section>
  </main>;
}
