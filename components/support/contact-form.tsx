"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { submitSupportRequest, type ContactState } from "@/app/ayuda/actions";

const initialState: ContactState = { status: "idle", message: "" };

export function ContactForm() {
  const [state, action] = useActionState(submitSupportRequest, initialState);
  return <form action={action} className="mt-7 grid gap-4"><label className="font-display text-xs font-black uppercase tracking-[.12em]">Correo<input name="email" type="email" required maxLength={320} autoComplete="email" className="mt-2 w-full border-[3px] border-ink bg-white px-4 py-3 font-sans text-sm outline-none focus:bg-lime/20"/></label><label className="font-display text-xs font-black uppercase tracking-[.12em]">Asunto<input name="subject" required minLength={3} maxLength={120} className="mt-2 w-full border-[3px] border-ink bg-white px-4 py-3 font-sans text-sm outline-none focus:bg-lime/20"/></label><label className="font-display text-xs font-black uppercase tracking-[.12em]">Mensaje<textarea name="message" required minLength={10} maxLength={2000} rows={5} className="mt-2 w-full resize-y border-[3px] border-ink bg-white px-4 py-3 font-sans text-sm leading-6 outline-none focus:bg-lime/20"/></label>{state.message ? <p role="status" className={`border-2 border-ink px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-lime" : "bg-orange-200"}`}>{state.message}</p> : null}{state.status !== "success" ? <ContactSubmit/> : null}</form>;
}

function ContactSubmit() { const { pending } = useFormStatus(); return <button disabled={pending} className="inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-ink px-5 py-4 font-black text-white shadow-hard transition hover:-translate-y-1 disabled:opacity-50"><Send size={18}/>{pending ? "Enviando…" : "Contactar soporte"}</button>; }
