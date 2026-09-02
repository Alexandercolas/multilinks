"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-cream p-6"><section className="max-w-lg border border-ink/12 bg-white p-8 text-center shadow-hard-lg"><Logo/><span className="mx-auto mt-8 grid h-16 w-16 place-items-center border border-ink/12 bg-orange-200 shadow-hard"><AlertTriangle size={30}/></span><h1 className="mt-7 font-display text-2xl font-black">No pudimos cargar el panel</h1><p className="mt-3 leading-7 text-black/60">Tu acceso sigue protegido. Intenta actualizar los datos; si continúa, revisaremos la conexión administrativa.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={reset} className="inline-flex items-center gap-2 border border-ink/12 bg-lime px-5 py-3 font-black shadow-hard"><RefreshCw size={17}/> Reintentar</button><Link href="/dashboard" className="border border-ink/12 bg-white px-5 py-3 font-black shadow-hard">Mi dashboard</Link></div></section></main>;
}
