import Link from "next/link";
import { ArrowUpRight, BarChart3, Check, Layers3, Palette, Sparkles, UserPlus, Link2, Share2, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { premiumBackgrounds, premiumBackgroundStyle } from "@/lib/profile-backgrounds";
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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MultiLinks",
  url: "https://multilinksrd.vercel.app",
  description: "Crea una página personal, reúne todos tus enlaces y compártela con una sola URL. Personaliza colores, foto y botones gratis.",
  inLanguage: "es-DO",
  publisher: {
    "@type": "Organization",
    name: "MultiLinks",
    url: "https://multilinksrd.vercel.app",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* JSON-LD (pedido explicito): ayuda a Google a entender de que
          trata el sitio sin tener que inferirlo del texto, y habilita
          resultados enriquecidos. Contenido 100% estatico (no hay
          input de usuario aca), por eso dangerouslySetInnerHTML es
          seguro -- es el patron recomendado por Next.js para JSON-LD,
          ya que interpolar {JSON.stringify(...)} como children lo
          escaparia como HTML y romperia el JSON. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 sm:py-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-5 text-sm font-bold lg:flex"><a href="#ejemplos" className="hover:text-grape-dark">Ejemplos</a><a href="#funciones" className="hover:text-grape-dark">Funciones</a><Link href="/planes" className="hover:text-grape-dark">Precios</Link><Link href="/ayuda" className="hover:text-grape-dark">Ayuda</Link></div>
          <Link
            href="/sign-in"
            className="hidden rounded-full border border-ink/15 px-4 py-2 font-display text-[10px] font-black transition hover:-translate-y-0.5 hover:border-ink/30 sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90 sm:px-5"
          >
            Crear mi página
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
        <div>
          <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-ink/10 bg-lime/15 px-3.5 py-1.5 font-display text-xs font-black tracking-wide text-grape-dark">
            <Sparkles size={14} /> HECHO PARA DESTACAR
          </div>
          <h1 className="max-w-3xl animate-fade-up font-display text-5xl font-black leading-[.95] tracking-[-.03em] [animation-delay:80ms] sm:text-7xl sm:leading-[.92] lg:text-[88px]">
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
              className="group flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Comenzar gratis
              <ArrowUpRight size={19} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full border border-ink/15 px-6 py-3.5 font-display text-xs font-black transition hover:-translate-y-0.5 hover:border-ink/30"
            >
              Iniciar sesión
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
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature, index) => <Reveal key={feature.title} delay={index * 80}><article className="h-full border-t border-ink/10 pt-5"><span className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 bg-lime/20 text-grape-dark"><feature.icon size={19}/></span><h3 className="mt-5 font-display text-base font-black">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{feature.text}</p></article></Reveal>)}</div>
      </section>

      <section className="border-y border-ink/[.08] bg-white/60"><div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
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
              <div className="h-full rounded-2xl border border-ink/[.07] bg-white p-7 shadow-[0_1px_2px_rgba(21,21,21,.04),0_18px_44px_-22px_rgba(21,21,21,.2)] transition hover:-translate-y-0.5">
                <span className="font-display text-sm font-black text-grape-dark">{step.n}</span>
                <step.icon className="mt-4 text-ink/70" size={24} />
                <h3 className="mt-4 font-display text-xl font-black">{step.title}</h3>
                <p className="mt-2 text-black/60">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div></section>

      <section className="bg-[#090b0d] px-6 py-20 text-white sm:py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#101318] p-7 shadow-[0_30px_90px_rgba(0,0,0,.42)] sm:p-10">
          <span aria-hidden="true" className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-lime/15 blur-3xl"/>
          <span aria-hidden="true" className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-grape/20 blur-3xl"/>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[.15em] text-lime"><span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_14px_#c9ff58]"/> Diseño premium</span>
              <h2 className="mt-5 max-w-3xl font-display text-3xl font-black tracking-[-.04em] sm:text-5xl">Claro cuando quieres.<br/><span className="text-lime">Neon cuando destacas.</span></h2>
              <p className="mt-5 max-w-2xl leading-7 text-white/55">Con Pro desbloqueas todos los temas, fondos con tu propia imagen y miniaturas de YouTube en tus enlaces.</p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-white/70"><span className="flex items-center gap-2"><Check className="text-lime" size={17}/> Sin tarjeta</span><span className="flex items-center gap-2"><Check className="text-lime" size={17}/> Tu página en minutos</span><span className="flex items-center gap-2"><Layers3 className="text-lime" size={17}/> Crece a tu ritmo</span></div>
            </div>
            <Link href="/sign-in?mode=signup" className="relative inline-flex items-center justify-center gap-2 self-start rounded-xl bg-lime px-6 py-4 font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(201,255,88,.18)] motion-reduce:transform-none motion-reduce:transition-none lg:self-center">Crear mi MultiLinks <ArrowUpRight size={19}/></Link>
          </div>
          <div className="relative mt-9 flex gap-3 overflow-x-auto pb-2" aria-label="Fondos premium disponibles con Pro">
            {premiumBackgrounds.slice(0, 10).map((background) => (
              <span key={background.id} className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-cover" style={premiumBackgroundStyle(background.id)}>
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-[8px] font-black uppercase tracking-wide text-white/80">{background.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

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
