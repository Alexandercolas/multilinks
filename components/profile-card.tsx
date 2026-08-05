import { ArrowUpRight } from "lucide-react";
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
    <div className="mx-auto mt-8 max-w-md space-y-3">{profile.links.filter(x => x.active && isSafeLink(x.url)).map(link => {
      const trackable = /^[0-9a-f-]{36}$/i.test(link.id);
      const href = preview ? undefined : trackable ? `/api/click/${link.id}` : link.url;
      return <a key={link.id} href={href} target={!preview ? "_blank" : undefined} rel="noreferrer" className={`flex w-full items-center justify-between ${buttonRadius} border-2 border-ink bg-white px-5 py-4 text-left font-bold text-ink shadow-[4px_4px_0_#151515] transition hover:-translate-y-1`}>{link.title}<ArrowUpRight size={18}/></a>;
    })}</div>
    <p className="mt-10 text-xs font-black tracking-widest opacity-55">MULTI//LINKS</p>
  </div>;
}
