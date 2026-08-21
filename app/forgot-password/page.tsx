"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "forgot", email }),
    });
    const result = await response.json().catch(() => null) as { message?: string } | null;
    setMessage(response.ok
      ? "Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña."
      : result?.message ?? "No pudimos enviar el correo. Inténtalo nuevamente.");
    setLoading(false);
  }

  return <main className="grid min-h-screen place-items-center bg-[#8566ff] px-5 py-12"><section className="w-full max-w-md rounded-[32px] border-2 border-ink bg-cream p-8 shadow-[10px_10px_0_#c9ff58]"><Logo/><h1 className="mt-8 text-4xl font-black">Recupera tu cuenta</h1><p className="mt-2 text-sm text-black/55">Te enviaremos un enlace seguro para crear una contraseña nueva.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-bold">Correo<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>{message ? <p className="rounded-xl bg-black/5 px-4 py-3 text-sm font-semibold">{message}</p> : null}<button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3.5 font-bold text-white disabled:opacity-50">{loading ? "Enviando…" : "Enviar enlace"}</button></form><Link href="/sign-in" className="mt-5 block text-center text-sm font-bold text-[#5f45d6]">Volver al acceso</Link></section></main>;
}
