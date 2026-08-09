"use client";

import { Search, ShieldOff, ShieldCheck } from "lucide-react";
import { useDeferredValue, useState } from "react";
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
};

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const filteredUsers = deferredSearch
    ? users.filter((user) => [user.email, user.username, user.display_name].some((value) => value?.toLowerCase().includes(deferredSearch)))
    : users;

  return <section id="usuarios" className="mt-8 border-[3px] border-ink bg-white shadow-hard-lg">
    <div className="flex flex-col gap-4 border-b-[3px] border-ink bg-lime p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-display text-xs font-black uppercase tracking-[.14em]">Directorio</p><h2 className="mt-1 font-display text-xl font-black">Usuarios registrados</h2></div>
      <label className="flex items-center gap-2 border-2 border-ink bg-white px-3 py-2 shadow-[3px_3px_0_#151515]">
        <Search size={18}/><span className="sr-only">Buscar usuarios</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Correo, nombre o usuario" className="w-full min-w-0 bg-transparent text-sm font-semibold outline-none sm:w-64"/>
      </label>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm">
      <thead className="border-b-2 border-ink bg-cream font-display text-[10px] uppercase tracking-[.12em]"><tr><th className="px-5 py-4">Usuario</th><th className="px-5 py-4">Correo</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Cuenta</th><th className="px-5 py-4">Registrado</th><th className="px-5 py-4">Acción</th></tr></thead>
      <tbody>{filteredUsers.map((user) => <tr key={user.id} className="border-b-2 border-ink/20 align-top last:border-b-0">
        <td className="px-5 py-4"><p className="font-black">{user.display_name || "Sin nombre"}</p><p className="mt-1 text-xs text-black/50">{user.username ? `@${user.username}` : "Perfil sin publicar"}</p></td>
        <td className="px-5 py-4 font-semibold">{user.email}</td>
        <td className="px-5 py-4"><span className="inline-flex border-2 border-ink bg-grape px-2 py-1 text-xs font-black text-white">{user.plan_name}</span></td>
        <td className="px-5 py-4">{user.suspended ? <><span className="inline-flex items-center gap-1 border-2 border-ink bg-red-200 px-2 py-1 text-xs font-black"><ShieldOff size={14}/> Suspendida</span><p className="mt-2 max-w-xs text-xs text-black/55">{user.suspension_reason}</p></> : <span className="inline-flex items-center gap-1 border-2 border-ink bg-lime px-2 py-1 text-xs font-black"><ShieldCheck size={14}/> Activa</span>}</td>
        <td className="px-5 py-4 text-black/55">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(user.created_at))}</td>
        <td className="px-5 py-4">{user.suspended ? <form action={setUserSuspension}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="shouldSuspend" value="false"/><SubmitButton className="border-2 border-ink bg-lime px-3 py-2 text-xs font-black shadow-[3px_3px_0_#151515] transition hover:-translate-y-0.5">Reactivar</SubmitButton></form> : <form action={setUserSuspension} className="flex min-w-72 gap-2"><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="shouldSuspend" value="true"/><input name="reason" required minLength={3} maxLength={500} placeholder="Motivo de suspensión" className="min-w-0 flex-1 border-2 border-ink px-3 py-2 text-xs outline-none focus:bg-cream"/><SubmitButton className="border-2 border-ink bg-white px-3 py-2 text-xs font-black shadow-[3px_3px_0_#151515] transition hover:bg-red-200">Suspender</SubmitButton></form>}</td>
      </tr>)}</tbody>
    </table></div>
    {filteredUsers.length === 0 ? <p className="border-t-2 border-ink p-8 text-center font-bold">No encontramos usuarios con esa búsqueda.</p> : null}
  </section>;
}
