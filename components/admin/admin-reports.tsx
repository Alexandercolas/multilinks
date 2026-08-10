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
  return <section id="reportes" className="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-[#101318]/95 text-white shadow-[0_28px_90px_rgba(0,0,0,.35)]">
    <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5"><div><p className="font-display text-xs font-black uppercase tracking-[.14em] text-lime">Moderación</p><h2 className="mt-1 font-display text-xl font-black">Reportes pendientes</h2></div><span className="grid h-12 w-12 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime shadow-[0_0_24px_rgba(201,255,88,.08)]"><Flag/></span></div>
    <div className="grid gap-4 p-5 lg:grid-cols-2">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-white">
      <div className="flex items-start justify-between gap-3"><div><span className="inline-flex rounded-full border border-lime/25 bg-lime/10 px-2.5 py-1 text-xs font-black text-lime">{reasonLabels[report.reason] ?? report.reason}</span><h3 className="mt-3 font-display text-base font-black">{report.profiles?.display_name ?? "Perfil eliminado"}</h3><p className="text-sm text-white/45">{report.profiles?.username ? `@${report.profiles.username}` : "Sin enlace disponible"}</p></div>{report.profiles?.username ? <Link href={`/${report.profiles.username}`} target="_blank" aria-label="Abrir perfil reportado" className="rounded-xl border border-white/15 bg-white/[.045] p-2 text-white/70 transition hover:border-lime/50 hover:text-lime motion-reduce:transition-none"><ExternalLink size={18}/></Link> : null}</div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-white/70">{report.description || "El reporte no incluyó una descripción."}</p><p className="mt-3 text-xs font-bold text-white/35">{new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at))}</p>
      <form action={reviewProfileReport} className="mt-4 grid gap-2"><input type="hidden" name="reportId" value={report.id}/><textarea name="note" maxLength={1000} placeholder="Nota interna opcional" className="min-h-20 resize-y rounded-xl border border-white/10 bg-white/[.045] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"/><div className="flex flex-wrap gap-2"><SubmitButton className="rounded-xl bg-lime px-3 py-2 text-xs font-black text-ink transition hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] motion-reduce:transition-none">Resolver</SubmitButton><button type="submit" name="status" value="dismissed" className="rounded-xl border border-white/15 bg-white/[.035] px-3 py-2 text-xs font-black text-white/70 transition hover:border-white/30 hover:text-white motion-reduce:transition-none">Descartar</button></div><input type="hidden" name="status" value="resolved"/></form>
    </article>)}</div>
    {reports.length === 0 ? <div className="p-10 text-center"><p className="font-display text-lg font-black">Todo limpio por aquí.</p><p className="mt-2 text-sm text-white/45">No hay reportes pendientes de revisión.</p></div> : null}
  </section>;
}
