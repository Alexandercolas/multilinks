"use client";

import { BarChart3, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";

export type AdminLogRow = {
  id: number;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  target_email: string | null;
  target_username: string | null;
  target_display_name: string | null;
};

const actionLabels: Record<string, string> = {
  suspend_user: "Suspendió una cuenta",
  reactivate_user: "Reactivó una cuenta",
  review_report: "Revisó un reporte",
  dismiss_report: "Descartó un reporte",
  update_support: "Tomó una solicitud de soporte",
  close_support: "Cerró una solicitud de soporte",
};

export function AdminAudit({ logs }: { logs: AdminLogRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const filteredLogs = deferredSearch ? logs.filter((log) => {
    return [actionLabels[log.action] ?? log.action, log.target_email, log.target_display_name, log.target_username]
      .some((value) => value?.toLowerCase().includes(deferredSearch));
  }) : logs;
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <section id="actividad" className="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-[#101318]/95 shadow-[0_28px_90px_rgba(0,0,0,.35)]">
    <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 text-white"><span className="grid h-11 w-11 place-items-center rounded-xl bg-lime/10 text-lime"><BarChart3/></span><div><p className="font-display text-xs font-black uppercase tracking-[.14em] text-lime">Auditoría</p><h2 className="font-display text-xl font-black">Actividad administrativa</h2></div></div><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2 text-white/55 focus-within:border-lime/70 focus-within:text-lime"><Search size={17}/><span className="sr-only">Buscar actividad</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Usuario, correo o acción" className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25 sm:w-60"/></label></div>
    <div className="divide-y divide-white/10">{pageLogs.map((log) => <article key={log.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-white">{actionLabels[log.action] ?? log.action}</p><p className="mt-1 text-sm text-white/45">{log.target_email ?? "Cuenta no disponible"}</p></div><time className="font-display text-[10px] font-black uppercase tracking-[.1em] text-white/35">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.created_at))}</time></article>)}</div>
    {filteredLogs.length === 0 ? <p className="p-8 text-center font-bold text-white/40">No encontramos actividad con esa búsqueda.</p> : <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold text-white/40">Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredLogs.length)} de {filteredLogs.length}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Actividad anterior" className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white/70 transition hover:border-lime/45 hover:text-lime disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"><ChevronLeft size={17}/></button><span className="min-w-20 text-center font-display text-[10px] font-black uppercase tracking-[.1em] text-white/55">{currentPage} de {totalPages}</span><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} aria-label="Actividad siguiente" className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white/70 transition hover:border-lime/45 hover:text-lime disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"><ChevronRight size={17}/></button></div></div>}
  </section>;
}
