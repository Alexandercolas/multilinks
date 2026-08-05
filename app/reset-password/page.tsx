"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) { setMessage("Las contraseñas no coinciden."); return; }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) { setMessage("El enlace expiró o no es válido. Solicita uno nuevo."); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return <main className="grid min-h-screen place-items-center bg-[#8566ff] px-5 py-12"><section className="w-full max-w-md rounded-[32px] border-2 border-ink bg-cream p-8 shadow-[10px_10px_0_#c9ff58]"><Logo/><h1 className="mt-8 text-4xl font-black">Nueva contraseña</h1><p className="mt-2 text-sm text-black/55">Elige una contraseña segura de al menos ocho caracteres.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-bold">Contraseña nueva<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label><label className="block text-sm font-bold">Confirmar contraseña<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>{message ? <p className="rounded-xl bg-black/5 px-4 py-3 text-sm font-semibold">{message}</p> : null}<button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3.5 font-bold text-white disabled:opacity-50">{loading ? "Guardando…" : "Guardar contraseña"}</button></form></section></main>;
}
