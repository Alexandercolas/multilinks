import Link from "next/link";
import { Flag, ExternalLink } from "lucide-react";
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

const reasonLabels: Record<string, string> = { spam: "Spam", abuse: "Acoso o abuso", impersonation: "Suplantación", inappropriate: "Contenido inapropiado", copyright: "Derechos de autor", other: "Otro" };

export function AdminReports({ reports }: { reports: AdminReportRow[] }) {
  return <section id="reportes" className="mt-8 border-[3px] border-ink bg-white text-ink shadow-hard-lg">
    <div className="flex items-center justify-between gap-4 border-b-[3px] border-ink p-5"><div><p className="font-display text-xs font-black uppercase tracking-[.14em] text-grape-dark">Moderación</p><h2 className="mt-1 font-display text-xl font-black">Reportes pendientes</h2></div><span className="grid h-12 w-12 place-items-center border-2 border-ink bg-ink text-white shadow-[3px_3px_0_#151515]"><Flag/></span></div>
    <div className="grid gap-4 p-5 lg:grid-cols-2">{reports.map((report) => <article key={report.id} className="border-[3px] border-ink bg-cream p-5 text-ink shadow-hard">
      <div className="flex items-start justify-between gap-3"><div><span className="inline-flex border-2 border-ink bg-lime px-2 py-1 text-xs font-black">{reasonLabels[report.reason] ?? report.reason}</span><h3 className="mt-3 font-display text-base font-black">{report.profiles?.display_name ?? "Perfil eliminado"}</h3><p className="text-sm text-black/55">{report.profiles?.username ? `@${report.profiles.username}` : "Sin enlace disponible"}</p></div>{report.profiles?.username ? <Link href={`/${report.profiles.username}`} target="_blank" aria-label="Abrir perfil reportado" className="border-2 border-ink bg-white p-2 shadow-[3px_3px_0_#151515]"><ExternalLink size={18}/></Link> : null}</div>
      <p className="mt-4 min-h-12 text-sm leading-6">{report.description || "El reporte no incluyó una descripción."}</p><p className="mt-3 text-xs font-bold text-black/45">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at))}</p>
      <form action={reviewProfileReport} className="mt-4 grid gap-2"><input type="hidden" name="reportId" value={report.id}/><textarea name="note" maxLength={1000} placeholder="Nota interna opcional" className="min-h-20 resize-y border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-lime/20"/><div className="flex flex-wrap gap-2"><SubmitButton className="border-2 border-ink bg-lime px-3 py-2 text-xs font-black shadow-[3px_3px_0_#151515]" >Resolver</SubmitButton><button type="submit" name="status" value="dismissed" className="border-2 border-ink bg-white px-3 py-2 text-xs font-black shadow-[3px_3px_0_#151515]">Descartar</button></div><input type="hidden" name="status" value="resolved"/></form>
    </article>)}</div>
    {reports.length === 0 ? <div className="p-10 text-center"><p className="font-display text-lg font-black">Todo limpio por aquí.</p><p className="mt-2 text-sm text-black/55">No hay reportes pendientes de revisión.</p></div> : null}
  </section>;
}
