import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HelpCircle, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/support/contact-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Ayuda y soporte", description: "Respuestas y soporte para usar MultiLinks." };

const faqs = [
  ["¿Cómo publico mi página?", "Entra a tu dashboard, completa tu perfil y guarda los cambios. Tu enlace público utiliza el nombre de usuario que elegiste."],
  ["¿Puedo cambiar mis enlaces?", "Sí. Puedes añadir, editar, ordenar, ocultar o eliminar enlaces desde tu dashboard."],
  ["¿Cómo cambio mi foto o colores?", "En Personalización puedes subir una foto y elegir el fondo, color de acento y estilo de botones."],
  ["¿Por qué no puedo entrar?", "Comprueba tu correo y contraseña. También puedes solicitar un enlace seguro o restablecer tu contraseña."],
  ["¿Cómo reporto un perfil?", "Abre el perfil y pulsa Reportar al final de la página. El reporte llegará de forma privada al equipo de moderación."],
];

export default function HelpPage() {
  return <main className="relative min-h-screen overflow-hidden bg-surface px-5 py-8 text-white sm:py-12">
    <span aria-hidden="true" className="pointer-events-none fixed -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-lime/10 blur-3xl"/>
    <span aria-hidden="true" className="pointer-events-none fixed -bottom-56 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-grape/10 blur-3xl"/>
    <div className="relative mx-auto max-w-5xl">
      <header className="flex items-center justify-between gap-4">
        <Logo/>
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.045] px-3 py-2 text-sm font-black text-white/70 transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none"><ArrowLeft size={16}/> Inicio</Link>
      </header>

      <section className="mt-12 animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/10 px-4 py-2 font-display text-xs font-black uppercase tracking-[.08em] text-lime">
          <HelpCircle size={16}/> CENTRO DE AYUDA
        </span>
        <h1 className="mt-7 max-w-3xl font-display text-4xl font-black leading-tight tracking-[-.04em] sm:text-6xl">¿En qué podemos ayudarte?</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-white/50">Encuentra respuestas rápidas o envíanos un mensaje directamente.</p>
      </section>

      <section className="mt-12 grid gap-3">
        {faqs.map(([question, answer], index) => (
          <details key={question} className="group animate-fade-up rounded-2xl border border-white/10 bg-card/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,.28)] transition hover:border-lime/25 motion-reduce:transition-none" style={{ animationDelay: `${index * 70}ms` }}>
            <summary className="cursor-pointer list-none font-display text-sm font-black marker:hidden">
              {question}
              <span className="float-right text-lime text-xl transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
            </summary>
            <p className="mt-4 max-w-3xl border-t border-white/10 pt-4 leading-7 text-white/55">{answer}</p>
          </details>
        ))}
      </section>

      <section className="mt-14 grid gap-8 rounded-[2rem] border border-white/15 bg-card/95 p-6 shadow-[0_24px_75px_rgba(0,0,0,.30)] md:grid-cols-[.8fr_1.2fr] sm:p-9">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime"><MessageCircle/></span>
          <h2 className="mt-6 font-display text-2xl font-black">¿Aún necesitas ayuda?</h2>
          <p className="mt-3 leading-7 text-white/55">Cuéntanos qué sucede. Tu solicitud quedará registrada para que podamos darle seguimiento.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <ContactForm/>
        </div>
      </section>
    </div>
  </main>;
}