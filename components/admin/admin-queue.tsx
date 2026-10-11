import Link from "next/link";
import { Search } from "lucide-react";
export type QueueControls = {
  total: number;
  page: number;
  search: string;
  status: string;
  query: Record<string, string>;
};
export function AdminQueue({
  id,
  title,
  controls,
  statuses,
  rows,
}: {
  id: string;
  title: string;
  controls: QueueControls;
  statuses: [string, string][];
  rows: {
    id: string;
    name: string;
    summary: string;
    status: string;
    date: string;
    details: React.ReactNode;
  }[];
}) {
  const url = (page: number) => {
    const q = new URLSearchParams(controls.query);
    q.set(id + "_page", String(page));
    return "/admin?" + q + "#" + id;
  };
  const pages = Math.max(1, Math.ceil(controls.total / 5));
  return (
    <section
      id={id}
      className="mt-8 min-w-0 rounded-2xl border border-white/10 bg-[#101010] p-5 text-white"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <form
        action={"/admin#" + id}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        {Object.entries(controls.query)
          .filter(([key]) => !key.startsWith(id + "_"))
          .map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        <label className="min-w-0 basis-full text-xs text-white/60 sm:flex-1 sm:basis-0">
          Buscar
          <div className="mt-1 flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3">
            <Search size={16} />
            <input
              name={id + "_search"}
              defaultValue={controls.search}
              placeholder={
                id === "reportes"
                  ? "Descripción o motivo"
                  : "Correo, asunto o mensaje"
              }
              className="min-w-0 w-full bg-transparent text-sm text-white"
            />
          </div>
        </label>
        <label className="text-xs text-white/60">
          Estado
          <select
            name={id + "_status"}
            defaultValue={controls.status}
            className="mt-1 block min-h-11 rounded-lg bg-[#242424] px-3 text-sm text-white"
          >
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded-lg border border-white/20 px-4 text-sm">
          Buscar
        </button>
      </form>
      <p className="mt-3 text-xs text-white/45 sm:hidden">
        Desliza la tabla para ver los detalles →
      </p>
      <div
        tabIndex={0}
        role="region"
        aria-label={title}
        className="mt-3 max-w-full overflow-x-auto rounded-lg border border-white/10"
      >
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/5 text-xs text-white/60">
            <tr>
              {["Cuenta / asunto", "Resumen", "Estado", "Fecha", "Gestión"].map(
                (label) => (
                  <th key={label} scope="col" className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="max-w-56 px-4 py-3 text-sm font-medium"
                >
                  <span className="block truncate" title={row.name}>
                    {row.name}
                  </span>
                </th>
                <td className="max-w-64 px-4 py-3 text-white/60">
                  <span className="block truncate" title={row.summary}>
                    {row.summary}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-white/60">
                  {row.status}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-white/60">
                  {new Date(row.date).toLocaleDateString("es-DO")}
                </td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="min-h-11 cursor-pointer content-center whitespace-nowrap text-sm text-lime">
                      Ver caso
                    </summary>
                    <div className="w-72 space-y-3 py-3 text-sm">
                      {row.details}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="py-6 text-sm text-white/50">
          No hay resultados con estos filtros.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
        <p>
          {controls.total} resultados · Página {controls.page} de {pages}
        </p>
        <nav aria-label={"Páginas de " + title} className="flex gap-2">
          {controls.page > 1 && (
            <Link
              href={url(controls.page - 1)}
              scroll={false}
              className="min-h-11 content-center rounded-lg border border-white/15 px-3"
            >
              Anterior
            </Link>
          )}
          {controls.page < pages && (
            <Link
              href={url(controls.page + 1)}
              scroll={false}
              className="min-h-11 content-center rounded-lg border border-white/15 px-3"
            >
              Siguiente
            </Link>
          )}
        </nav>
      </div>
    </section>
  );
}
