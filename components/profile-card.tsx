import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types/profile";
import { themeClasses } from "@/lib/demo-profile";
import { isSafeLink } from "@/lib/profile-storage";

export function ProfileCard({ profile, preview = false }: { profile: Profile; preview?: boolean }) {
  const buttonRadius = profile.buttonStyle === "pill" ? "rounded-full" : profile.buttonStyle === "square" ? "rounded-md" : "rounded-2xl";
  return <div className={`min-h-full ${themeClasses[profile.theme]} px-6 py-10 text-center`} style={{ backgroundColor: profile.backgroundColor }}>
    <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] border-current bg-white text-2xl font-black text-ink" style={{ backgroundColor: profile.accentColor }}>
      {profile.avatarImage ? <div role="img" aria-label={`Foto de ${profile.displayName}`} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${profile.avatarImage})` }}/> : profile.avatar || profile.displayName.slice(0,2).toUpperCase()}
    </div>
    <h1 className="mt-5 text-3xl font-black tracking-tight">{profile.displayName}</h1>
    <p className="mt-2 text-sm opacity-75">@{profile.username}</p>
    <p className="mx-auto mt-4 max-w-sm leading-6 opacity-80">{profile.bio}</p>
    <div className="mx-auto mt-8 max-w-md space-y-3">{profile.links.filter(x => x.active && isSafeLink(x.url)).map((link, index, visibleLinks) => {
      const trackable = /^[0-9a-f-]{36}$/i.test(link.id);
      const href = preview ? undefined : trackable ? `/api/click/${link.id}` : link.url;
      const showSection = link.sectionTitle && (index === 0 || visibleLinks[index - 1]?.sectionTitle !== link.sectionTitle);
      return <div key={link.id}>{showSection ? <h2 className="mb-3 mt-7 text-sm font-black uppercase tracking-[.18em] opacity-75">{link.sectionTitle}</h2> : null}<a href={href} target={!preview ? "_blank" : undefined} rel="noreferrer" className={`flex w-full items-center gap-3 ${buttonRadius} border-2 border-ink bg-white px-4 py-3 text-left font-bold text-ink shadow-[4px_4px_0_#151515] transition hover:-translate-y-1`}>{link.icon ? <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-black/5 text-xl">{/^https?:\/\//i.test(link.icon) ? <span role="img" aria-label="Icono del enlace" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${link.icon})` }}/> : link.icon}</span> : null}<span className="min-w-0 flex-1">{link.title}</span><ArrowUpRight className="shrink-0" size={18}/></a></div>;
    })}</div>
    {!preview ? <div className="mx-auto mt-12 max-w-md rounded-3xl border-2 border-ink bg-white/90 p-5 text-ink shadow-[5px_5px_0_#151515]"><p className="text-sm font-black">¿Te gustó esta página?</p><p className="mt-1 text-xs opacity-65">Reúne tus redes, proyectos y contactos en un solo enlace.</p><Link href="/sign-in" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-white">Crea tu propio MultiLinks gratis <ArrowUpRight size={17}/></Link></div> : null}
    <p className="mt-8 text-xs font-black tracking-widest opacity-55">MULTI//LINKS</p>
  </div>;
}
