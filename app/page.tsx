import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Home() {
  return <main className="min-h-screen overflow-hidden">
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><Logo/><div className="flex items-center gap-3"><Link href="/demo" className="hidden rounded-full px-5 py-2.5 font-semibold sm:block">Ver demo</Link><Link href="/dashboard" className="rounded-full bg-ink px-5 py-2.5 font-bold text-white">Crear mi página</Link></div></nav>
    <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-14 px-6 py-14 lg:grid-cols-[1.1fr_.9fr]">
      <div><div className="mb-6 inline-flex rotate-[-2deg] items-center gap-2 border-2 border-ink bg-lime px-4 py-2 text-sm font-black shadow-hard"><Sparkles size={16}/> HECHO PARA DESTACAR</div><h1 className="max-w-3xl text-6xl font-black leading-[.9] tracking-[-.07em] sm:text-7xl lg:text-[92px]">Todo lo tuyo.<br/><span className="text-[#7055e8]">Un solo link.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-black/65">Comparte tu contenido, proyectos y redes desde una página que sí se siente tuya. Lista en minutos.</p><div className="mt-9 flex flex-wrap gap-4"><Link href="/dashboard" className="flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:-translate-y-1">Comenzar gratis <ArrowUpRight size={19}/></Link><span className="flex items-center gap-2 px-3 text-sm font-semibold"><Check size={18}/> Sin tarjeta</span></div></div>
      <div className="relative mx-auto w-full max-w-[390px] rotate-[3deg] rounded-[42px] border-[3px] border-ink bg-ink p-3 shadow-[16px_16px_0_#c9ff58]"><div className="rounded-[30px] bg-[#8566ff] px-7 py-10 text-center text-white"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-lime text-2xl font-black text-ink">ML</div><h2 className="mt-5 text-2xl font-black">Perfil Demo</h2><p className="mt-2 text-sm text-white/75">Contenido, proyectos y comunidad</p><div className="mt-8 space-y-3 text-left text-ink">{["Crear mi página", "Ver cómo funciona", "Perfil de demostración"].map(text => <div key={text} className="flex items-center justify-between rounded-2xl border-2 border-ink bg-white px-5 py-4 font-bold shadow-[3px_3px_0_#151515]">{text}<ArrowUpRight size={18}/></div>)}</div></div></div>
    </section>
  </main>;
}
