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
      className="mt-8 rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-lime">CONTROL DE CUENTAS</p>
          <h2 className="mt-1 text-xl font-semibold">Usuarios y Premium</h2>
        </div>
        <label className="text-xs text-white/70">
          Buscar usuarios
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
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
      <div
        aria-busy={loading}
        className={`mt-5 space-y-3 ${loading ? "opacity-60" : ""}`}
      >
        {rows.map((user) => (
          <article
            key={user.id}
            className="rounded-xl border border-white/10 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-semibold">
                  {user.display_name || "Sin nombre"}{" "}
                  {user.is_owner && (
                    <span className="text-xs text-lime">· Propietario</span>
                  )}
                </h3>
                <p className="mt-1 break-all text-xs text-white/65">
                  {user.email}
                </p>
                {user.username && (
                  <Link
                    href={`/${user.username}`}
                    target="_blank"
                    className="mt-2 inline-block text-xs text-lime"
                  >
                    Ver @{user.username} ↗
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-2 py-1">
                  {user.premium ? "Premium" : "Free"}
                </span>
                <span
                  className={`rounded-full px-2 py-1 ${user.suspended ? "bg-red-400/10 text-red-300" : "bg-white/5 text-white/70"}`}
                >
                  {user.suspended
                    ? "Suspendida"
                    : user.published
                      ? "Perfil público"
                      : "Perfil privado"}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/60">
              {user.premium_override
                ? `Control manual${user.override_ends_at ? " hasta " + new Date(user.override_ends_at).toLocaleDateString("es-DO") : " sin vencimiento"}`
                : user.billing_connected
                  ? `Suscripción conectada · ${user.subscription_status}`
                  : "Acceso automático según plan y prueba"}
            </p>
            {user.suspension_reason && (
              <p className="mt-2 text-xs text-red-300">
                {user.suspension_reason}
              </p>
            )}
            {!user.is_owner && (
              <details className="mt-4 border-t border-white/10 pt-3">
                <summary className="min-h-11 cursor-pointer text-sm font-medium">
                  Gestionar cuenta
                </summary>
                <form
                  onSubmit={(event) => submit(event, user)}
                  className="mt-2 grid gap-3 sm:grid-cols-2"
                >
                  <label className="text-xs text-white/70">
                    Acción
                    <select
                      name="command"
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
                    {pending === user.id ? "Aplicando…" : "Aplicar cambio"}
                  </button>
                </form>
              </details>
            )}
          </article>
        ))}
      </div>
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
