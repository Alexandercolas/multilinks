"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, GripVertical, Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { ProfileCard } from "@/components/profile-card";
import { demoProfile } from "@/lib/demo-profile";
import { isSafeLink, readStoredProfile, saveStoredProfile } from "@/lib/profile-storage";
import type { Profile } from "@/types/profile";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const stored = readStoredProfile(); if (stored) setProfile(stored); }, []);
  const save = () => { if (saveStoredProfile(profile)) { setSaved(true); setTimeout(() => setSaved(false), 1500); } };
  const updateLink = (id: string, change: object) => setProfile(p => ({...p, links: p.links.map(x => x.id === id ? {...x, ...change} : x)}));
  const addLink = () => setProfile(p => ({...p, links: [...p.links, {id: crypto.randomUUID(), title: "Nuevo enlace", url: "https://", active: true}]}));
  return <main className="min-h-screen bg-[#f2efe7]">
    <header className="flex h-20 items-center justify-between border-b border-black/10 bg-white px-5 lg:px-8"><Logo/><Link href={`/${profile.username}`} className="flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-bold"><Eye size={16}/> Ver página</Link></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_410px]">
      <section>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#7055e8]">TU ESPACIO</p><h1 className="mt-1 text-4xl font-black tracking-tight">Personaliza tu página</h1></div><button onClick={save} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">{saved ? "¡Guardado!" : "Guardar cambios"}</button></div>
        <div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Perfil</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nombre" value={profile.displayName} onChange={displayName => setProfile({...profile, displayName})}/><Field label="Usuario" value={profile.username} onChange={username => setProfile({...profile, username: username.toLowerCase().replace(/[^a-z0-9_-]/g, "")})}/></div><label className="mt-4 block text-sm font-bold">Biografía<textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={3} className="mt-2 w-full resize-none rounded-xl border border-black/15 px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label><div className="mt-5"><p className="text-sm font-bold">Tema</p><div className="mt-3 flex gap-3">{(["lime", "violet", "sunset"] as const).map(theme => <button key={theme} aria-label={theme} onClick={() => setProfile({...profile, theme})} className={`h-10 w-10 rounded-full border-2 ${profile.theme === theme ? "border-ink ring-2 ring-offset-2 ring-ink" : "border-transparent"} ${theme === "lime" ? "bg-lime" : theme === "violet" ? "bg-[#8566ff]" : "bg-[#ff7356]"}`}/>)}</div></div></div>
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Mis enlaces</h2><p className="mt-1 text-xs text-black/45">Usa una dirección completa, por ejemplo https://instagram.com/usuario</p></div><button onClick={addLink} className="flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-black"><Plus size={17}/> Agregar</button></div><div className="mt-5 space-y-3">{profile.links.map(link => <div key={link.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${isSafeLink(link.url) ? "border-black/10" : "border-red-400"}`}><GripVertical className="hidden shrink-0 text-black/25 sm:block" size={20}/><div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2"><input value={link.title} aria-label="Título del enlace" onChange={e => updateLink(link.id, {title: e.target.value})} className="min-w-0 rounded-lg bg-[#f5f3ed] px-3 py-2 text-sm font-semibold outline-none"/><input value={link.url} aria-label="Dirección del enlace" onChange={e => updateLink(link.id, {url: e.target.value})} className="min-w-0 rounded-lg bg-[#f5f3ed] px-3 py-2 text-sm outline-none"/></div><button aria-label="Activar enlace" onClick={() => updateLink(link.id, {active: !link.active})} className={`h-6 w-11 shrink-0 rounded-full p-1 ${link.active ? "bg-[#7055e8]" : "bg-black/15"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${link.active ? "translate-x-5" : ""}`}/></button><button aria-label="Eliminar" onClick={() => setProfile({...profile, links: profile.links.filter(x => x.id !== link.id)})} className="p-2 text-black/35 hover:text-red-500"><Trash2 size={18}/></button></div>)}</div></div>
      </section>
      <aside className="hidden lg:block"><div className="sticky top-6"><p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-black/40">Vista previa</p><div className="mx-auto h-[720px] max-w-[390px] overflow-hidden rounded-[42px] border-[10px] border-ink bg-ink shadow-xl"><div className="h-full overflow-y-auto rounded-[30px]"><ProfileCard profile={profile} preview/></div></div></div></aside>
    </div>
  </main>;
}
function Field({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) { return <label className="text-sm font-bold">{label}<input value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>; }
