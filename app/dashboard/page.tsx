"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Eye, GripVertical, ImagePlus, LogOut, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { ProfileCard } from "@/components/profile-card";
import { demoProfile } from "@/lib/demo-profile";
import { isSafeLink, saveStoredProfile } from "@/lib/profile-storage";
import { createClient } from "@/lib/supabase/client";
import type { LinkItem, Profile } from "@/types/profile";

type DbProfile = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: Profile["theme"];
  background_color: string;
  accent_color: string;
  button_style: Profile["buttonStyle"];
};

type DbLink = { id: string; title: string; url: string; active: boolean; clicks: number; icon: string | null; section_title: string | null };

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [totalViews, setTotalViews] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: adminAccess } = await supabase.rpc("is_admin");
      setIsAdmin(Boolean(adminAccess));
      const [{ data: dbProfile }, { data: dbLinks }, { data: viewRows }, { data: subscription }] = await Promise.all([
        supabase.from("profiles").select("username,display_name,bio,avatar_url,theme,background_color,accent_color,button_style").eq("id", user.id).maybeSingle<DbProfile>(),
        supabase.from("links").select("id,title,url,active,clicks,icon,section_title").eq("profile_id", user.id).order("position"),
        supabase.from("profile_daily_views").select("views").eq("profile_id", user.id),
        supabase.from("subscriptions").select("plan_id,status").eq("user_id", user.id).maybeSingle(),
      ]);
      setIsPro(Boolean(adminAccess) || (subscription?.plan_id === "pro" && ["active", "trialing"].includes(subscription.status)));
      setTotalViews((viewRows ?? []).reduce((total, row) => total + row.views, 0));
      if (dbProfile) {
        setProfile({
          username: dbProfile.username,
          displayName: dbProfile.display_name,
          bio: dbProfile.bio,
          avatar: dbProfile.display_name.slice(0, 2).toUpperCase(),
          avatarImage: dbProfile.avatar_url ?? undefined,
          theme: dbProfile.theme,
          backgroundColor: dbProfile.background_color,
          accentColor: dbProfile.accent_color,
          buttonStyle: dbProfile.button_style,
          links: (dbLinks ?? []).map((link: DbLink) => ({ id: link.id, title: link.title, url: link.url, active: link.active, clicks: link.clicks, icon: link.icon ?? undefined, sectionTitle: link.section_title ?? undefined })),
        });
      } else {
        const base = (user.email?.split("@")[0] ?? "usuario").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
        setProfile({ ...demoProfile, username: base.length >= 3 ? base : `user-${user.id.slice(0, 6)}`, displayName: "Mi perfil", links: [] });
      }
      setReady(true);
    }
    void loadProfile();
  }, []);

  const updateLink = (id: string, change: Partial<LinkItem>) => setProfile(p => ({ ...p, links: p.links.map(link => link.id === id ? { ...link, ...change } : link) }));
  const addLink = () => {
    if (!isPro && profile.links.filter(link => link.active).length >= 10) {
      setMessage("El plan Gratis permite hasta 10 enlaces activos. Mejora a Pro para añadir enlaces ilimitados.");
      return;
    }
    setProfile(p => ({ ...p, links: [...p.links, { id: crypto.randomUUID(), title: "Nuevo enlace", url: "https://", active: true, icon: "🔗" }] }));
  };

  function uploadPhoto(file?: File) {
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Selecciona una imagen válida."); return; }
    if (file.size > 1_000_000) { setPhotoError("La imagen debe pesar menos de 1 MB."); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfile(p => ({ ...p, avatarImage: String(reader.result) }));
    reader.onerror = () => setPhotoError("No pudimos leer la imagen.");
    reader.readAsDataURL(file);
  }

  async function save() {
    if (profile.username.length < 3) { setMessage("El usuario debe tener al menos 3 caracteres."); return; }
    if (profile.links.some(link => !isSafeLink(link.url))) { setMessage("Corrige las direcciones marcadas en rojo."); return; }
    if (!isPro && profile.links.filter(link => link.active).length > 10) { setMessage("El plan Gratis permite hasta 10 enlaces activos."); return; }
    if (!isPro && profile.theme === "neon") { setMessage("Neon Dark es un tema exclusivo de MultiLinks Pro."); return; }
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/sign-in"); return; }

    let avatarUrl = profile.avatarImage;
    if (photoFile) {
      const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (uploadError) { setMessage("No pudimos subir la foto."); setSaving(false); return; }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      username: profile.username,
      display_name: profile.displayName,
      bio: profile.bio,
      avatar_url: avatarUrl?.startsWith("data:") ? null : avatarUrl ?? null,
      theme: profile.theme,
      background_color: profile.backgroundColor ?? "#c9ff58",
      accent_color: profile.accentColor ?? "#8566ff",
      button_style: profile.buttonStyle ?? "rounded",
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      setMessage(profileError.code === "23505" ? "Ese nombre de usuario ya está ocupado." : "No pudimos guardar el perfil.");
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase.from("links").delete().eq("profile_id", user.id);
    const rows = profile.links.map((link, position) => ({ id: link.id, profile_id: user.id, title: link.title, url: link.url, active: link.active, position, clicks: link.clicks ?? 0, icon: link.icon?.trim() || null, section_title: link.sectionTitle?.trim() || null }));
    const { error: linksError } = rows.length ? await supabase.from("links").insert(rows) : { error: null };
    if (deleteError || linksError) { setMessage("El perfil se guardó, pero algunos enlaces no."); setSaving(false); return; }

    const stored = { ...profile, avatarImage: avatarUrl?.startsWith("data:") ? undefined : avatarUrl };
    setProfile(stored);
    saveStoredProfile(stored);
    setPhotoFile(null);
    setMessage("¡Cambios publicados!");
    setSaving(false);
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#f2efe7]"><p className="font-bold">Cargando tu espacio…</p></main>;

  return <main className="min-h-screen bg-[#f2efe7]">
    <header className="flex h-20 items-center justify-between border-b border-black/10 bg-white px-5 lg:px-8"><Logo/><div className="flex items-center gap-2">{isAdmin ? <Link href="/admin" className="rounded-full bg-lime px-4 py-2 text-sm font-black">Administración</Link> : null}<Link href={`/${profile.username}`} className="flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-bold"><Eye size={16}/> Ver página</Link><button onClick={signOut} aria-label="Cerrar sesión" className="rounded-full p-2 hover:bg-black/5"><LogOut size={19}/></button></div></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_410px]">
      <section>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#7055e8]">TU ESPACIO</p><h1 className="mt-1 text-4xl font-black tracking-tight">Personaliza tu página</h1></div><div className="text-right"><button onClick={save} disabled={saving} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Publicando…" : "Guardar y publicar"}</button>{message ? <p className="mt-2 max-w-xs text-xs font-semibold">{message}</p> : null}</div></div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2"><StatCard icon={<Eye size={20}/>} label="Visitas al perfil" value={totalViews}/><StatCard icon={<MousePointerClick size={20}/>} label="Clics en enlaces" value={profile.links.reduce((total, link) => total + (link.clicks ?? 0), 0)}/></div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-[3px] border-ink bg-ink p-5 text-white shadow-hard"><div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center border-2 border-white/30 bg-white/10 text-lime"><Crown size={21}/></span><div><p className="font-display font-black">Desbloquea MultiLinks Pro</p><p className="mt-1 text-sm text-white/60">Enlaces ilimitados, estadísticas completas y más personalización.</p></div></div><Link href="/planes" className="rounded-full border-2 border-white bg-white px-5 py-3 text-sm font-black text-ink">Ver planes</Link></div>
        <div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Perfil</h2><div className="mt-5 flex flex-wrap items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-lime text-xl font-black">{profile.avatarImage ? <div role="img" aria-label="Foto seleccionada" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${profile.avatarImage})` }}/> : profile.avatar}</div><div><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-bold hover:bg-black/5"><ImagePlus size={17}/> Subir foto<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => uploadPhoto(e.target.files?.[0])}/></label>{profile.avatarImage ? <button onClick={() => { setProfile({ ...profile, avatarImage: undefined }); setPhotoFile(null); }} className="ml-2 text-sm font-semibold text-red-500">Quitar</button> : null}<p className="mt-2 text-xs text-black/45">JPG, PNG o WebP · máximo 1 MB</p>{photoError ? <p className="mt-1 text-xs font-semibold text-red-500">{photoError}</p> : null}</div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nombre" value={profile.displayName} onChange={displayName => setProfile({ ...profile, displayName })}/><Field label="Usuario" value={profile.username} onChange={username => setProfile({ ...profile, username: username.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}/></div><label className="mt-4 block text-sm font-bold">Biografía<textarea maxLength={240} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} className="mt-2 w-full resize-none rounded-xl border border-black/15 px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label></div>
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-black">Apariencia</h2>{!isPro ? <Link href="/planes" className="inline-flex items-center gap-1 text-xs font-black text-grape-dark"><Crown size={14}/> Temas Pro</Link> : null}</div>
          <div className="mt-5"><p className="text-sm font-bold">Temas rápidos</p><div className="mt-3 flex flex-wrap gap-3">{(["lime", "violet", "sunset", "neon"] as const).map(theme => { const color = theme === "lime" ? "#c9ff58" : theme === "violet" ? "#8566ff" : theme === "sunset" ? "#ff7356" : "#0f1115"; const locked = theme === "neon" && !isPro; return <button key={theme} type="button" aria-label={locked ? "Tema Neon Dark, disponible en Pro" : `Tema ${theme}`} onClick={() => locked ? setMessage("Neon Dark es un tema exclusivo de MultiLinks Pro.") : setProfile({ ...profile, theme, backgroundColor: color, accentColor: theme === "neon" ? "#c6ff3d" : profile.accentColor })} className={`relative h-11 w-11 rounded-full border-2 ${profile.theme === theme ? "border-ink ring-2 ring-offset-2 ring-ink" : "border-black/15"}`} style={{ backgroundColor: color }}>{locked ? <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-lime"><Crown size={11}/></span> : null}</button>; })}</div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><ColorField label="Color de fondo" value={profile.backgroundColor ?? "#c9ff58"} onChange={backgroundColor => setProfile({ ...profile, backgroundColor })}/><ColorField label="Color de acento" value={profile.accentColor ?? "#8566ff"} onChange={accentColor => setProfile({ ...profile, accentColor })}/></div>
          <div className="mt-6"><p className="text-sm font-bold">Forma de botones</p><div className="mt-3 flex flex-wrap gap-2">{(["rounded", "pill", "square"] as const).map(style => <button key={style} onClick={() => setProfile({ ...profile, buttonStyle: style })} className={`border-2 px-4 py-2 text-sm font-bold ${style === "pill" ? "rounded-full" : style === "square" ? "rounded-md" : "rounded-2xl"} ${profile.buttonStyle === style ? "border-ink bg-lime" : "border-black/10"}`}>{style === "rounded" ? "Redondeado" : style === "pill" ? "Cápsula" : "Cuadrado"}</button>)}</div></div>
        </div>
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Mis enlaces</h2><p className="mt-1 text-xs text-black/45">Añade títulos de sección e íconos opcionales para organizar mejor tu página.</p></div><button onClick={addLink} className="flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-black"><Plus size={17}/> Agregar</button></div><div className="mt-5 space-y-3">{profile.links.map(link => <div key={link.id} className={`flex items-start gap-3 rounded-2xl border p-3 ${isSafeLink(link.url) ? "border-black/10" : "border-red-400"}`}><GripVertical className="mt-2 hidden shrink-0 text-black/25 sm:block" size={20}/><div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_1fr_90px]"><input value={link.title} aria-label="Título del enlace" placeholder="Título" onChange={e => updateLink(link.id, { title: e.target.value })} className="min-w-0 rounded-lg bg-[#f5f3ed] px-3 py-2 text-sm font-semibold outline-none"/><input value={link.url} aria-label="Dirección del enlace" placeholder="https://..." onChange={e => updateLink(link.id, { url: e.target.value })} className="min-w-0 rounded-lg bg-[#f5f3ed] px-3 py-2 text-sm outline-none"/><input value={link.icon ?? ""} maxLength={500} aria-label="Ícono del enlace" placeholder="Emoji o URL" onChange={e => updateLink(link.id, { icon: e.target.value })} className="min-w-0 rounded-lg bg-[#f5f3ed] px-3 py-2 text-sm outline-none"/><input value={link.sectionTitle ?? ""} maxLength={60} aria-label="Título de sección" placeholder="Sección opcional, por ejemplo: Mis redes" onChange={e => updateLink(link.id, { sectionTitle: e.target.value })} className="min-w-0 rounded-lg bg-[#f5f3ed] px-3 py-2 text-sm outline-none sm:col-span-3"/></div><button aria-label="Activar enlace" onClick={() => updateLink(link.id, { active: !link.active })} className={`mt-2 h-6 w-11 shrink-0 rounded-full p-1 ${link.active ? "bg-[#7055e8]" : "bg-black/15"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${link.active ? "translate-x-5" : ""}`}/></button><button aria-label="Eliminar" onClick={() => setProfile({ ...profile, links: profile.links.filter(item => item.id !== link.id) })} className="mt-1 p-2 text-black/35 hover:text-red-500"><Trash2 size={18}/></button></div>)}</div></div>
      </section>
      <aside className="hidden lg:block"><div className="sticky top-6"><p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-black/40">Vista previa</p><div className="mx-auto h-[720px] max-w-[390px] overflow-hidden rounded-[42px] border-[10px] border-ink bg-ink shadow-xl"><div className="h-full overflow-y-auto rounded-[30px]"><ProfileCard profile={profile} preview/></div></div></div></aside>
    </div>
  </main>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm font-bold">{label}<input value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal outline-none focus:border-[#7055e8]"/></label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm font-bold">{label}<span className="mt-2 flex items-center gap-3 rounded-xl border border-black/15 p-2"><input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"/><span className="font-mono text-xs font-normal uppercase text-black/55">{value}</span></span></label>; }
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime text-ink">{icon}</span><div><p className="text-2xl font-black">{value.toLocaleString("es-DO")}</p><p className="text-xs font-bold text-black/45">{label}</p></div></div>; }
