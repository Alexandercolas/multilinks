import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flag, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { ReportForm } from "@/components/support/report-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reportar perfil", robots: { index: false, follow: false } };

export default async function ReportProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const normalizedUsername = decodeURIComponent(username).toLowerCase();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("username,display_name").eq("username", normalizedUsername).eq("published", true).maybeSingle();
  if (!profile) notFound();

  return <main className="min-h-screen bg-cream px-5 py-8 sm:py-12"><div className="mx-auto max-w-xl"><div className="flex items-center justify-between gap-4"><Logo/><Link href={`/${profile.username}`} className="inline-flex items-center gap-2 border border-ink/12 bg-white px-3 py-2 text-sm font-black shadow-[0_1px_2px_rgba(21,21,21,.04),0_10px_28px_-14px_rgba(21,21,21,.18)]"><ArrowLeft size={16}/> Volver</Link></div><section className="relative mt-10 overflow-hidden border border-ink/12 bg-white p-6 shadow-hard-lg sm:p-9"><span className="absolute -right-9 -top-9 h-28 w-28 rounded-full border border-ink/12 bg-orange-200" aria-hidden="true"/><div className="relative"><span className="grid h-14 w-14 place-items-center border border-ink/12 bg-lime shadow-hard"><Flag/></span><p className="mt-7 font-display text-xs font-black uppercase tracking-[.15em] text-grape-dark">Seguridad comunitaria</p><h1 className="mt-3 font-display text-3xl font-black leading-tight">Reportar a @{profile.username}</h1><p className="mt-4 leading-7 text-black/60">Usa este formulario únicamente para contenido que incumpla las normas. El propietario del perfil no verá tu información ni tu reporte.</p><ReportForm username={profile.username}/><div className="mt-7 flex items-start gap-3 border-t-2 border-ink/20 pt-5 text-sm text-black/55"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><p>Los reportes se revisan manualmente. En una emergencia, contacta directamente a las autoridades correspondientes.</p></div></div></section></div></main>;
}
