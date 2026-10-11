import Link from "next/link";
import { AdminQueue, type QueueControls } from "./admin-queue";
import { reviewProfileReport } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";

export type AdminReportRow = {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  profiles: { username: string; display_name: string } | null;
};

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  abuse: "Acoso o abuso",
  impersonation: "Suplantación",
  inappropriate: "Contenido inapropiado",
  copyright: "Derechos de autor",
  other: "Otro",
};

export function AdminReports({
  reports,
  controls,
}: {
  reports: AdminReportRow[];
  controls: QueueControls;
}) {
  return (
    <AdminQueue
      id="reportes"
      title="Reportes"
      controls={controls}
      statuses={[
        ["active", "Pendientes"],
        ["pending", "Sin revisar"],
        ["reviewing", "En revisión"],
        ["resolved", "Resueltos"],
        ["dismissed", "Descartados"],
        ["all", "Todos"],
      ]}
      rows={reports.map((report) => ({
        id: report.id,
        name: report.profiles?.display_name || "Perfil eliminado",
        summary: reasonLabels[report.reason] || report.reason,
        status:
          (
            {
              pending: "Pendiente",
              reviewing: "En revisión",
              resolved: "Resuelto",
              dismissed: "Descartado",
            } as Record<string, string>
          )[report.status] || report.status,
        date: report.created_at,
        details: (
          <>
            {report.profiles?.username && (
              <Link
                href={`/${report.profiles.username}`}
                target="_blank"
                className="text-lime"
              >
                @{report.profiles.username} ↗
              </Link>
            )}
            <p className="whitespace-pre-wrap break-words text-white/70">
              {report.description || "Sin descripción"}
            </p>
            <form action={reviewProfileReport} className="space-y-3">
              <input type="hidden" name="reportId" value={report.id} />
              <label className="block text-xs text-white/60">
                Nota interna
                <textarea
                  name="note"
                  maxLength={1000}
                  className="mt-1 min-h-20 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-white"
                />
              </label>
              <label className="block text-xs text-white/60">
                Decisión
                <select
                  name="status"
                  defaultValue="resolved"
                  className="mt-1 min-h-11 w-full rounded-lg bg-[#242424] px-3 text-white"
                >
                  <option value="reviewing">En revisión</option>
                  <option value="resolved">Resolver</option>
                  <option value="dismissed">Descartar</option>
                </select>
              </label>
              <SubmitButton className="min-h-11 rounded-lg bg-lime px-3 text-xs font-semibold text-ink">
                Aplicar decisión
              </SubmitButton>
            </form>
          </>
        ),
      }))}
    />
  );
}
