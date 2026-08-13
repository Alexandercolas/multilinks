"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { submitSupportRequest, type ContactState } from "@/app/ayuda/actions";

const initialState: ContactState = { status: "idle", message: "" };

export function ContactForm() {
  const [state, action] = useActionState(submitSupportRequest, initialState);
  return <form action={action} className="mt-7 grid gap-4"><label className="font-display text-xs font-semibold uppercase tracking-[.12em] text-white">Correo<input name="email" type="email" required maxLength={320} autoComplete="email" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"/></label><label className="font-display text-xs font-semibold uppercase tracking-[.12em] text-white">Asunto<input name="subject" required minLength={3} maxLength={120} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"/></label><label className="font-display text-xs font-semibold uppercase tracking-[.12em] text-white">Mensaje<textarea name="message" required minLength={10} maxLength={2000} rows={5} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 font-sans text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"/></label>{state.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm font-bold ${state.status === "success" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-300" : "border-red-300/25 bg-red-300/10 text-red-300"}`}>{state.message}</p> : null}{state.status !== "success" ? <ContactSubmit/> : null}</form>;
}

function ContactSubmit() { const { pending } = useFormStatus(); return <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-4 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"><Send size={18}/>{pending ? "Enviando…" : "Contactar soporte"}</button>; }
