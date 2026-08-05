"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("Revisa tu correo para confirmar la cuenta.");
      else router.push("/dashboard");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("Correo o contraseña incorrectos.");
      else { router.push("/dashboard"); router.refresh(); }
    }
    setLoading(false);
  }

  return <main className="grid min-h-screen place-items-center bg-[#8566ff] px-5 py-12">
    <section className="w-full max-w-md rounded-[32px] border-2 border-ink bg-cream p-7 shadow-[10px_10px_0_#c9ff58] sm:p-9">
      <Logo/>
      <h1 className="mt-8 text-4xl font-black tracking-tight">{mode === "login" ? "Qué bueno verte" : "Crea tu MultiLink"}</h1>
      <p className="mt-2 text-sm text-black/55">{mode === "login" ? "Entra para administrar tu página." : "Tu página pública empieza aquí."}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-bold">Correo<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>
        <label className="block text-sm font-bold">Contraseña<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>
        {message ? <p className="rounded-xl bg-black/5 px-4 py-3 text-sm font-semibold">{message}</p> : null}
        <button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3.5 font-bold text-white disabled:opacity-50">{loading ? "Procesando…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
      </form>
      {mode === "login" ? <Link href="/forgot-password" className="mt-4 block text-center text-sm font-bold text-[#5f45d6]">¿Olvidaste tu contraseña?</Link> : null}
      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="mt-5 w-full text-sm font-bold text-[#5f45d6]">{mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}</button>
      <Link href="/" className="mt-5 block text-center text-xs font-semibold text-black/45">Volver al inicio</Link>
    </section>
  </main>;
}
