import { AdminQueue, type QueueControls } from "./admin-queue";
import { updateSupportRequest } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";

export type SupportRequestRow = {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

export function AdminSupport({
  requests,
  controls,
}: {
  requests: SupportRequestRow[];
  controls: QueueControls;
}) {
  return (
    <AdminQueue
      id="soporte"
      title="Soporte"
      controls={controls}
      statuses={[
        ["active", "Abiertos y en proceso"],
        ["open", "Abiertos"],
        ["in_progress", "En proceso"],
        ["closed", "Cerrados"],
        ["all", "Todos"],
      ]}
      rows={requests.map((request) => ({
        id: request.id,
        name: request.subject,
        summary: request.email,
        status:
          request.status === "in_progress"
            ? "En proceso"
            : request.status === "closed"
              ? "Cerrado"
              : "Abierto",
        date: request.created_at,
        details: (
          <>
            <a href={`mailto:${request.email}`} className="break-all text-lime">
              Responder a {request.email}
            </a>
            <p className="whitespace-pre-wrap break-words text-white/70">
              {request.message}
            </p>
            <form action={updateSupportRequest} className="space-y-3">
              <input type="hidden" name="requestId" value={request.id} />
              <label className="block text-xs text-white/60">
                Estado
                <select
                  name="status"
                  defaultValue={
                    request.status === "open"
                      ? "in_progress"
                      : request.status === "closed"
                        ? "open"
                        : "closed"
                  }
                  className="mt-1 min-h-11 w-full rounded-lg bg-[#242424] px-3 text-white"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En proceso</option>
                  <option value="closed">Cerrar caso</option>
                </select>
              </label>
              <SubmitButton className="min-h-11 rounded-lg bg-lime px-3 text-xs font-semibold text-ink">
                Actualizar caso
              </SubmitButton>
            </form>
          </>
        ),
      }))}
    />
  );
}
