"use client";

import { ChevronLeft, ChevronRight, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { setUserSuspension } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string;
  username: string | null;
  display_name: string | null;
  published: boolean;
  plan_name: string;
  subscription_status: string;
  suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  total_count?: number;
};

export function AdminUsersTable({ users, initialTotal }: { users: AdminUserRow[]; initialTotal: number }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(users);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ search: deferredSearch, page: String(currentPage) });
        const response = await fetch(`/api/admin/users?${params}`, { signal: controller.signal });
        const result = await response.json() as { users?: AdminUserRow[]; total?: number };
        if (response.ok) {
          setRows(result.users ?? []);
          setTotal(result.total ?? 0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [currentPage, deferredSearch]);

  return <section id="usuarios" className="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-[#101318]/95 text-white shadow-[0_28px_90px_rgba(0,0,0,.35)]">
    <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-display text-xs font-black uppercase tracking-[.14em] text-lime">Directorio</p><h2 className="mt-1 font-display text-xl font-black">Usuarios registrados</h2></div>
      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2 text-white/55 focus-within:border-lime/70 focus-within:text-lime">
        <Search size={18}/><span className="sr-only">Buscar usuarios</span>
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Correo, nombre o usuario" className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25 sm:w-64"/>
      </label>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm">
      <thead className="border-b border-white/10 bg-white/[.025] font-display text-[10px] uppercase tracking-[.12em] text-white/40"><tr><th className="px-5 py-4">Usuario</th><th className="px-5 py-4">Correo</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Cuenta</th><th className="px-5 py-4">Registrado</th><th className="px-5 py-4">Acción</th></tr></thead>
      <tbody className={loading ? "opacity-45" : ""}>{rows.map((user) => <tr key={user.id} className="border-b border-white/10 align-top transition last:border-b-0 hover:bg-white/[.025] motion-reduce:transition-none">
        <td className="px-5 py-4"><p className="font-black">{user.display_name || "Sin nombre"}</p><p className="mt-1 text-xs text-white/40">{user.username ? `@${user.username}` : "Perfil sin publicar"}</p></td>
        <td className="px-5 py-4 font-semibold">{user.email}</td>
        <td className="px-5 py-4"><span className="inline-flex rounded-full border border-grape/35 bg-grape/15 px-2.5 py-1 text-xs font-black text-grape">{user.plan_name}</span></td>
        <td className="px-5 py-4">{user.suspended ? <><span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs font-black text-red-300"><ShieldOff size={14}/> Suspendida</span><p className="mt-2 max-w-xs text-xs text-white/40">{user.suspension_reason}</p></> : <span className="inline-flex items-center gap-1 rounded-full border border-lime/25 bg-lime/10 px-2.5 py-1 text-xs font-black text-lime"><ShieldCheck size={14}/> Activa</span>}</td>
        <td className="px-5 py-4 text-white/45">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(user.created_at))}</td>
        <td className="px-5 py-4">{user.suspended ? <form action={setUserSuspension}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="shouldSuspend" value="false"/><SubmitButton className="rounded-xl bg-lime px-3 py-2 text-xs font-black text-ink transition hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] motion-reduce:transition-none">Reactivar</SubmitButton></form> : <form action={setUserSuspension} className="flex min-w-72 gap-2"><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="shouldSuspend" value="true"/><input name="reason" required minLength={3} maxLength={500} placeholder="Motivo de suspensión" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"/><SubmitButton className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-black text-red-300 transition hover:border-red-300/50 hover:bg-red-400/15 motion-reduce:transition-none">Suspender</SubmitButton></form>}</td>
      </tr>)}</tbody>
    </table></div>
    {!loading && rows.length === 0 ? <p className="border-t border-white/10 p-8 text-center font-bold text-white/45">No encontramos usuarios con esa búsqueda.</p> : null}
    {total > 0 ? <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold text-white/40">Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} de {total}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1 || loading} aria-label="Página anterior" className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white/70 transition hover:border-lime/45 hover:text-lime disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"><ChevronLeft size={17}/></button><span className="min-w-20 text-center font-display text-[10px] font-black uppercase tracking-[.1em] text-white/55">{currentPage} de {totalPages}</span><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages || loading} aria-label="Página siguiente" className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white/70 transition hover:border-lime/45 hover:text-lime disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"><ChevronRight size={17}/></button></div></div> : null}
  </section>;
}
