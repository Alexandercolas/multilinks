import Link from "next/link";
import { ArrowUpRight, Check, Sparkles, UserPlus, Link2, Share2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { MarqueeRibbon } from "@/components/marquee-ribbon";

const categories = ["PORTAFOLIO", "REDES SOCIALES", "TIENDA", "MÚSICA", "COMUNIDAD", "PROYECTOS"];

const steps = [
  {
    n: "01",
    icon: UserPlus,
    title: "Crea tu cuenta",
    text: "Regístrate con tu correo en menos de un minuto, sin tarjeta.",
  },
  {
    n: "02",
    icon: Link2,
    title: "Añade tus enlaces",
    text: "Pega tus redes, tu tienda, tu portafolio o lo que quieras compartir.",
  },
  {
    n: "03",
    icon: Share2,
    title: "Comparte tu link",
    text: "Una sola URL para tu bio de Instagram, TikTok o donde sea.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/demo" className="group hidden px-1 py-2.5 font-semibold sm:block">
            <span className="border-b-2 border-transparent transition group-hover:border-ink">Ver ejemplo</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-5 py-2.5 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-hard"
          >
            Crear mi página
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-14 px-6 py-14 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-6 inline-flex animate-fade-up rotate-[-2deg] items-center gap-2 border-2 border-ink bg-lime px-4 py-2 text-sm font-black shadow-hard">
            <Sparkles size={16} /> HECHO PARA DESTACAR
          </div>
          <h1 className="max-w-3xl animate-fade-up font-display text-6xl font-black leading-[.92] tracking-[-.03em] [animation-delay:80ms] sm:text-7xl lg:text-[88px]">
            Todo lo tuyo.
            <br />
            <span className="text-grape-dark">Un solo link.</span>
          </h1>
          <p className="mt-7 max-w-xl animate-fade-up text-lg leading-8 text-black/65 [animation-delay:160ms]">
            Comparte tu contenido, proyectos y redes desde una página que sí se siente tuya. Lista en minutos.
          </p>
          <div className="mt-9 flex flex-wrap animate-fade-up items-center gap-4 [animation-delay:240ms]">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:shadow-hard-lg"
            >
              Comenzar gratis
              <ArrowUpRight size={19} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <span className="flex items-center gap-2 px-3 text-sm font-semibold">
              <Check size={18} /> Sin tarjeta
            </span>
          </div>
        </div>

        <div className="group relative mx-auto w-full max-w-[390px]">
          {/* sticker chips "pinned" behind the main card, floating gently */}
          <div
            className="pin absolute -left-6 top-6 hidden w-40 animate-float rounded-2xl border-2 border-ink bg-white px-4 py-3 text-xs font-bold shadow-hard [--rot:-9deg] [animation-delay:.4s] sm:block"
            style={{ transform: "rotate(-9deg)" }}
          >
            🎵 Mi música
          </div>
          <div
            className="pin absolute -right-8 bottom-10 hidden w-40 animate-float rounded-2xl border-2 border-ink bg-lime px-4 py-3 text-xs font-bold shadow-hard [--rot:8deg] [animation-delay:1.1s] sm:block"
            style={{ transform: "rotate(8deg)" }}
          >
            🛍️ Mi tienda
          </div>

          <div className="relative rotate-[3deg] rounded-[42px] border-[3px] border-ink bg-ink p-3 shadow-[16px_16px_0_#c9ff58] transition-transform duration-500 group-hover:rotate-0">
            <div className="rounded-[30px] bg-grape px-7 py-10 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-lime text-2xl font-black text-ink">
                ML
              </div>
              <h2 className="mt-5 font-display text-2xl font-black">Mi MultiLinks</h2>
              <p className="mt-2 text-sm text-white/75">Contenido, proyectos y comunidad</p>
              <div className="mt-8 space-y-3 text-left text-ink">
                {["Mi portafolio", "Mis redes sociales", "Mi comunidad"].map((text) => (
                  <div
                    key={text}
                    className="flex items-center justify-between rounded-2xl border-2 border-ink bg-white px-5 py-4 font-bold shadow-[3px_3px_0_#151515] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#151515]"
                  >
                    {text}
                    <ArrowUpRight size={18} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarqueeRibbon items={categories} />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-grape-dark">
            Cómo funciona
          </span>
          <h2 className="mt-3 max-w-lg font-display text-4xl font-black tracking-[-.02em] sm:text-5xl">
            Tres pasos y ya está.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120}>
              <div className="h-full rounded-3xl border-2 border-ink bg-white p-7 shadow-hard transition hover:-translate-y-1">
                <span className="font-display text-sm font-black text-black/30">{step.n}</span>
                <step.icon className="mt-4" size={26} />
                <h3 className="mt-4 font-display text-xl font-black">{step.title}</h3>
                <p className="mt-2 text-black/65">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="border-t-2 border-ink bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-sm text-black/50">
            © {new Date().getFullYear()} MultiLinks · Hecho en República Dominicana
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link href="/planes" className="hover:underline">Planes</Link>
            <Link href="/demo" className="hover:underline">
              Ver ejemplo
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Crear cuenta
            </Link>
            <Link href="/ayuda" className="hover:underline">Ayuda</Link>
            <Link href="/terminos" className="hover:underline">Términos</Link>
            <Link href="/privacidad" className="hover:underline">Privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
