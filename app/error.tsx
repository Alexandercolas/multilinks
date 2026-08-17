"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-12 text-ink">
      <section className="w-full max-w-xl border-[3px] border-ink bg-white p-7 text-center shadow-hard-lg sm:p-10">
        <div className="flex justify-center"><Logo /></div>
        <span className="mx-auto mt-8 grid h-16 w-16 place-items-center border-[3px] border-ink bg-lime shadow-hard" aria-hidden="true">
          <AlertTriangle size={30} />
        </span>
        <p className="mt-8 font-display text-xs font-black uppercase tracking-[.14em] text-grape-dark">Error inesperado</p>
        <h1 className="mt-3 font-display text-2xl font-black leading-tight sm:text-3xl">Algo salió mal de nuestro lado</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-black/60">Ya registramos el problema. Puedes intentarlo nuevamente o volver al inicio mientras lo revisamos.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-lime px-5 py-3 font-black shadow-hard transition hover:-translate-y-0.5 motion-reduce:transition-none">
            <RefreshCw size={17} /> Reintentar
          </button>
          <Link href="/" className="inline-flex items-center justify-center border-2 border-ink bg-white px-5 py-3 font-black shadow-hard transition hover:-translate-y-0.5 motion-reduce:transition-none">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
