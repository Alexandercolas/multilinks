"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  premium: boolean;
  premium_override: boolean;
  override_ends_at: string | null;
  billing_connected: boolean;
  is_owner: boolean;
};
const actions = [
  ["premium_on", "Activar Premium"],
  ["premium_off", "Desactivar Premium"],
  ["premium_reset", "Restaurar plan automático"],
  ["hide_profile", "Ocultar perfil"],
  ["show_profile", "Publicar perfil"],
  ["suspend", "Suspender cuenta"],
  ["reactivate", "Reactivar cuenta"],
];
export function AdminUsersTable({
  users,
  initialTotal,
}: {
  users: AdminUserRow[];
  initialTotal: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(users);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [command, setCommand] = useState("premium_on");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/users?${new URLSearchParams({ search, page: String(page) })}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "No pudimos cargar los usuarios.");
        setRows(data.users);
        setTotal(data.total);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "No pudimos cargar los usuarios.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, page, revision]);
  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    user: AdminUserRow,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const command = String(data.get("command"));
    const name = user.username ? "@" + user.username : user.email;
    const label = actions.find((a) => a[0] === command)?.[1];
    if (
      !window.confirm(
        `${label} para ${name}?\nEl cambio quedará registrado. No cancela ni modifica cobros externos.`,
      )
    )
      return;
    setPending(user.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          command,
          reason: String(data.get("reason")),
          days: data.get("days") === "none" ? null : Number(data.get("days")),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(`Cambio aplicado a ${name}.`);
      setSelectedUser(null);
      setRevision((v) => v + 1);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo aplicar el cambio.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <section
      id="usuarios"
      className="mt-8 min-w-0 max-w-full rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-lime">CONTROL DE CUENTAS</p>
          <h2 className="mt-1 text-xl font-semibold">Usuarios y Premium</h2>
        </div>
        <label className="w-full text-xs text-white/70 sm:w-72">
          Buscar usuarios ⌕
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUser(null);
              setPage(1);
            }}
            placeholder="Correo, nombre o usuario"
            className="mt-1 block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <p className="mt-4 text-sm text-white/65">
        Puedes conceder Premium, forzar Free o volver al plan automático. Los
        cambios de acceso conservan el contenido y no cancelan suscripciones ni
        cobros del proveedor.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-lime/10 p-3 text-sm text-lime"
        >
          {message}
        </p>
      )}
      <p className="mt-4 text-xs text-white/45 sm:hidden">
        Desliza la tabla para ver todos los detalles y acciones →
      </p>
      <div
        role="region"
        aria-label="Tabla de usuarios"
        tabIndex={0}
        aria-busy={loading}
        className={`mt-3 max-w-full overflow-x-auto rounded-xl border border-white/10 ${loading ? "opacity-60" : ""}`}
      >
        <table className="w-full min-w-[960px] text-left text-sm">
          <caption className="sr-only">
            Usuarios registrados: cinco por página
          </caption>
          <thead className="bg-white/5 text-xs text-white/60">
            <tr>
              {[
                "Usuario",
                "Correo",
                "Plan y acceso",
                "Estado",
                "Registro",
                "Acciones",
              ].map((label) => (
                <th key={label} scope="col" className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.03]">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span
                    className="block max-w-48 truncate font-medium"
                    title={user.display_name || "Sin nombre"}
                  >
                    {user.display_name || "Sin nombre"}
                  </span>
                  {user.username && (
                    <Link
                      href={`/${user.username}`}
                      target="_blank"
                      className="text-xs text-lime"
                    >
                      @{user.username} ↗
                    </Link>
                  )}
                  {user.is_owner && (
                    <span className="block text-xs text-white/50">
                      Propietario
                    </span>
                  )}
                </th>
                <td className="px-4 py-3">
                  <span
                    className="block max-w-56 truncate text-white/70"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={user.premium ? "text-lime" : "text-white/70"}
                  >
                    {user.premium ? "Pro" : "Free"}
                  </span>
                  <span className="mt-1 block whitespace-nowrap text-xs text-white/45">
                    {user.premium_override
                      ? user.override_ends_at
                        ? "Manual hasta " +
                          new Date(user.override_ends_at).toLocaleDateString(
                            "es-DO",
                          )
                        : "Manual · sin vencimiento"
                      : user.billing_connected
                        ? `Suscripción · ${user.subscription_status}`
                        : "Automático"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    title={user.suspension_reason || undefined}
                    className={
                      user.suspended ? "text-red-300" : "text-white/65"
                    }
                  >
                    {user.suspended
                      ? "Suspendida"
                      : user.published
                        ? "Público"
                        : "Privado"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-white/60">
                  {new Date(user.created_at).toLocaleDateString("es-DO")}
                </td>
                <td className="px-4 py-3">
                  {user.is_owner ? (
                    <span className="text-xs text-white/45">
                      Cuenta protegida
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={pending !== null || loading}
                        onClick={() => {
                          setSelectedUser(user);
                          setCommand(
                            user.premium ? "premium_off" : "premium_on",
                          );
                        }}
                        className={`min-h-11 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${user.premium ? "border border-white/20 text-white" : "bg-lime text-ink"}`}
                      >
                        {user.premium ? "Desactivar Pro" : "Activar Pro"}
                      </button>
                      <button
                        type="button"
                        disabled={pending !== null || loading}
                        aria-label={`Gestionar ${user.username || user.email}`}
                        onClick={() => {
                          setSelectedUser(user);
                          setCommand("premium_reset");
                        }}
                        className="min-h-11 rounded-lg border border-white/15 px-3 text-xs text-white/70 disabled:opacity-50"
                      >
                        Gestionar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="mt-4 rounded-xl border border-white/15 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 break-words font-medium">
              Gestionar @{selectedUser.username || selectedUser.email}
            </h3>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => setSelectedUser(null)}
              className="min-h-11 px-3 text-sm text-white/60"
            >
              Cerrar
            </button>
          </div>
          <form
            key={selectedUser.id}
            onSubmit={(event) => submit(event, selectedUser)}
            className="mt-2 grid gap-3 sm:grid-cols-2"
          >
            <label className="text-xs text-white/70">
              Acción
              <select
                name="command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                className="mt-1 block min-h-11 w-full rounded-lg bg-[#242424] px-3 text-sm text-white"
              >
                {actions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/70">
              Duración al activar Premium
              <select
                name="days"
                defaultValue="30"
                className="mt-1 block min-h-11 w-full rounded-lg bg-[#242424] px-3 text-sm text-white"
              >
                <option value="30">30 días</option>
                <option value="90">90 días</option>
                <option value="365">1 año</option>
                <option value="none">Sin vencimiento</option>
              </select>
            </label>
            <label className="text-xs text-white/70 sm:col-span-2">
              Motivo obligatorio
              <input
                name="reason"
                required
                minLength={3}
                maxLength={500}
                placeholder="Ej. cortesía, soporte o moderación"
                className="mt-1 block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
            <button
              disabled={pending !== null}
              className="min-h-11 rounded-lg bg-lime px-4 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {pending === selectedUser.id ? "Aplicando…" : "Aplicar cambio"}
            </button>
          </form>
        </div>
      )}
      {!rows.length && !loading && (
        <p className="mt-5 text-sm text-white/60">No encontramos usuarios.</p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-white/60">
          {total} usuarios · Página {page} de{" "}
          {Math.max(1, Math.ceil(total / 5))}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="min-h-11 rounded-lg border border-white/15 px-3 disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            disabled={page * 5 >= total || loading}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-11 rounded-lg border border-white/15 px-3 disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
