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
  return <main className="min-h-screen bg-cream px-5 py-8 sm:py-12"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between gap-4"><Logo/><Link href="/" className="inline-flex items-center gap-2 border-2 border-ink bg-white px-3 py-2 text-sm font-black shadow-[3px_3px_0_#151515]"><ArrowLeft size={16}/> Inicio</Link></header><section className="mt-12 animate-fade-up"><span className="inline-flex rotate-[-2deg] items-center gap-2 border-2 border-ink bg-lime px-4 py-2 font-display text-xs font-black shadow-hard"><HelpCircle size={17}/> CENTRO DE AYUDA</span><h1 className="mt-7 max-w-3xl font-display text-4xl font-black leading-tight tracking-[-.04em] sm:text-6xl">¿En qué podemos ayudarte?</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">Encuentra respuestas rápidas o envíanos un mensaje directamente.</p></section><section className="mt-12 grid gap-5">{faqs.map(([question, answer], index) => <details key={question} className="group animate-fade-up border-[3px] border-ink bg-white p-5 shadow-hard" style={{ animationDelay: `${index * 70}ms` }}><summary className="cursor-pointer list-none font-display text-sm font-black marker:hidden">{question}<span className="float-right text-xl group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl border-t-2 border-ink/20 pt-4 leading-7 text-black/60">{answer}</p></details>)}</section><section className="mt-14 grid gap-8 border-[3px] border-ink bg-grape p-6 text-white shadow-hard-lg md:grid-cols-[.8fr_1.2fr] sm:p-9"><div><span className="grid h-14 w-14 place-items-center border-[3px] border-ink bg-lime text-ink shadow-hard"><MessageCircle/></span><h2 className="mt-6 font-display text-2xl font-black">¿Aún necesitas ayuda?</h2><p className="mt-3 leading-7 text-white/75">Cuéntanos qué sucede. Tu solicitud quedará registrada para que podamos darle seguimiento.</p></div><div className="border-[3px] border-ink bg-cream p-5 text-ink shadow-hard"><ContactForm/></div></section></div></main>;
}
