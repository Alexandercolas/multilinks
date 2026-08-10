import Link from "next/link";
import { ArrowUpRight, BarChart3, Check, Layers3, Palette, Sparkles, UserPlus, Link2, Share2, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { LandingProfileDemo } from "@/components/landing-profile-demo";
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

const features = [
  { icon: Link2, title: "Un solo link", text: "Reúne todo lo importante en una sola página." },
  { icon: Palette, title: "Tu propia identidad", text: "Temas, colores, fotos y estilos que reflejan tu marca." },
  { icon: Zap, title: "Rápido y fácil", text: "Publica y actualiza tus enlaces sin tocar código." },
  { icon: BarChart3, title: "Hecho para crecer", text: "Mide visitas y clics desde tu propio panel." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 sm:py-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-5 text-sm font-bold lg:flex"><a href="#ejemplos" className="hover:text-grape-dark">Ejemplos</a><a href="#funciones" className="hover:text-grape-dark">Funciones</a><Link href="/planes" className="hover:text-grape-dark">Precios</Link><Link href="/ayuda" className="hover:text-grape-dark">Ayuda</Link></div>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-hard sm:px-5"
          >
            Crear mi página
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
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

        <div id="ejemplos" className="relative"><LandingProfileDemo/></div>
      </section>

      <MarqueeRibbon items={categories} />

      <section id="funciones" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <Reveal><div className="mx-auto max-w-2xl text-center"><span className="font-display text-xs font-black uppercase tracking-[.16em] text-grape-dark">Todo bajo control</span><h2 className="mt-3 font-display text-4xl font-black tracking-[-.03em] sm:text-5xl">Tu presencia digital,<br/><span className="text-grape-dark">sin el desorden.</span></h2><p className="mx-auto mt-5 max-w-xl text-black/60">Redes, proyectos, música, tienda y contacto bajo una URL que sí se siente tuya.</p></div></Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature, index) => <Reveal key={feature.title} delay={index * 80}><article className="h-full border-t-2 border-ink pt-5"><span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-lime"><feature.icon size={21}/></span><h3 className="mt-5 font-display text-base font-black">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-black/60">{feature.text}</p></article></Reveal>)}</div>
      </section>

      <section className="border-y-2 border-ink bg-white/55"><div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
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
      </div></section>

      <section className="bg-[#090b0d] px-6 py-20 text-white sm:py-24"><div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#101318] p-7 shadow-[0_30px_90px_rgba(0,0,0,.42)] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12"><span aria-hidden="true" className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-lime/15 blur-3xl"/><span aria-hidden="true" className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-grape/20 blur-3xl"/><div className="relative"><span className="inline-flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[.15em] text-lime"><span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_14px_#c9ff58]"/> Diseño premium</span><h2 className="mt-5 max-w-3xl font-display text-3xl font-black tracking-[-.04em] sm:text-5xl">Claro cuando quieres.<br/><span className="text-lime">Neon cuando destacas.</span></h2><p className="mt-5 max-w-2xl leading-7 text-white/55">Empieza gratis y activa más temas, estadísticas y personalización cuando tu presencia lo necesite.</p><div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-white/70"><span className="flex items-center gap-2"><Check className="text-lime" size={17}/> Sin tarjeta</span><span className="flex items-center gap-2"><Check className="text-lime" size={17}/> Tu página en minutos</span><span className="flex items-center gap-2"><Layers3 className="text-lime" size={17}/> Crece a tu ritmo</span></div></div><Link href="/sign-in?mode=signup" className="relative mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-6 py-4 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(201,255,88,.18)] motion-reduce:transform-none motion-reduce:transition-none lg:mt-0">Crear mi MultiLinks <ArrowUpRight size={19}/></Link></div></section>

      <footer className="border-t border-white/10 bg-[#090b0d] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} MultiLinks · Hecho en República Dominicana
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/65">
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
