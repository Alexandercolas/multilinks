import { ArrowUpRight } from "lucide-react";
import type { Profile } from "@/types/profile";
import { themeClasses } from "@/lib/demo-profile";

export function ProfileCard({ profile, preview = false }: { profile: Profile; preview?: boolean }) {
  return <div className={`min-h-full ${themeClasses[profile.theme]} px-6 py-10 text-center`}>
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-current bg-white text-2xl font-black text-ink">{profile.avatar || profile.displayName.slice(0,2).toUpperCase()}</div>
    <h1 className="mt-5 text-3xl font-black tracking-tight">{profile.displayName}</h1>
    <p className="mt-2 text-sm opacity-75">@{profile.username}</p>
    <p className="mx-auto mt-4 max-w-sm leading-6 opacity-80">{profile.bio}</p>
    <div className="mx-auto mt-8 max-w-md space-y-3">{profile.links.filter(x => x.active).map(link =>
      <a key={link.id} href={preview ? undefined : link.url} target={preview ? undefined : "_blank"} rel="noreferrer" className="flex w-full items-center justify-between rounded-2xl border-2 border-ink bg-white px-5 py-4 text-left font-bold text-ink shadow-[4px_4px_0_#151515] transition hover:-translate-y-1">{link.title}<ArrowUpRight size={18}/></a>
    )}</div>
    <p className="mt-10 text-xs font-black tracking-widest opacity-55">MULTI//LINKS</p>
  </div>;
}
