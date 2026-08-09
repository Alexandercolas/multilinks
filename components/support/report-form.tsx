"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { submitProfileReport, type ReportState } from "@/app/report/[username]/actions";

const initialState: ReportState = { status: "idle", message: "" };

export function ReportForm({ username }: { username: string }) {
  const [state, action] = useActionState(submitProfileReport, initialState);
  return <form action={action} className="mt-7 space-y-5">
    <input type="hidden" name="username" value={username}/>
    <label className="block font-display text-xs font-black uppercase tracking-[.12em]">Motivo<select name="reason" required defaultValue="" className="mt-2 w-full border-[3px] border-ink bg-white px-4 py-3 font-sans text-sm font-semibold outline-none focus:bg-lime/20"><option value="" disabled>Selecciona un motivo</option><option value="spam">Spam o engaño</option><option value="abuse">Acoso o abuso</option><option value="impersonation">Suplantación de identidad</option><option value="inappropriate">Contenido inapropiado</option><option value="copyright">Derechos de autor</option><option value="other">Otro motivo</option></select></label>
    <label className="block font-display text-xs font-black uppercase tracking-[.12em]">Descripción <span className="font-sans font-semibold normal-case tracking-normal text-black/45">(opcional)</span><textarea name="description" maxLength={1000} rows={5} placeholder="Cuéntanos brevemente qué sucede…" className="mt-2 w-full resize-y border-[3px] border-ink bg-white px-4 py-3 font-sans text-sm font-semibold leading-6 outline-none focus:bg-lime/20"/></label>
    {state.message ? <p role="status" className={`border-2 border-ink px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-lime" : "bg-orange-200"}`}>{state.message}</p> : null}
    {state.status !== "success" ? <ReportSubmitButton/> : null}
  </form>;
}

function ReportSubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-ink px-5 py-4 font-black text-white shadow-hard transition hover:-translate-y-1 disabled:cursor-wait disabled:opacity-50"><Send size={18}/>{pending ? "Enviando…" : "Enviar reporte"}</button>;
}
