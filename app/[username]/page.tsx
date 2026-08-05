import Link from "next/link";
import { ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { ProfileCard } from "@/components/profile-card";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { ShareProfileButton } from "@/components/share-profile-button";
import { demoProfile } from "@/lib/demo-profile";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

type DbProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: Profile["theme"];
  background_color: string;
  accent_color: string;
  button_style: Profile["buttonStyle"];
};

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const normalizedUsername = decodeURIComponent(username).toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,avatar_url,theme,background_color,accent_color,button_style")
    .eq("username", normalizedUsername)
    .eq("published", true)
    .maybeSingle<DbProfile>();

  if (data) {
    const { data: links } = await supabase
      .from("links")
      .select("id,title,url,active,icon,section_title")
      .eq("profile_id", data.id)
      .eq("active", true)
      .order("position");
    const profile: Profile = {
      username: data.username,
      displayName: data.display_name,
      bio: data.bio,
      avatar: data.display_name.slice(0, 2).toUpperCase(),
      avatarImage: data.avatar_url ?? undefined,
      theme: data.theme,
      backgroundColor: data.background_color,
      accentColor: data.accent_color,
      buttonStyle: data.button_style,
      links: (links ?? []).map((link) => ({ ...link, icon: link.icon ?? undefined, sectionTitle: link.section_title ?? undefined })),
    };
    return <main className="min-h-screen p-6"><ProfileViewTracker profileId={data.id} /><div className="mx-auto mb-4 flex max-w-md justify-end"><ShareProfileButton title={profile.displayName}/></div><div className="mx-auto max-w-md"><ProfileCard profile={profile} /></div></main>;
  }

  if (normalizedUsername === "demo") {
    return <main className="min-h-screen p-6"><div className="mx-auto max-w-md"><ProfileCard profile={demoProfile} /></div></main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] p-6 text-center">
      <div className="relative max-w-lg overflow-hidden rounded-[2.25rem] border-2 border-black bg-white p-9 shadow-[10px_10px_0_#8566ff] sm:p-12">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-lime"/><div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-[#8566ff]/15"/>
        <div className="relative"><Logo /><div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-lime px-4 py-2 text-sm font-black"><CircleCheck size={18}/> Buena noticia</div>
        <Sparkles className="mx-auto mt-6 text-[#7055e8]" size={34}/>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">¡Este enlace puede ser tuyo!</h1>
        <p className="mx-auto mt-4 max-w-sm leading-7 text-black/60">El nombre <strong className="text-ink">@{normalizedUsername}</strong> está libre. Crea tu página, añade tus redes y compártela en minutos.</p>
        <div className="mt-6 rounded-2xl border border-black/10 bg-[#f8f6ef] px-4 py-3 text-sm font-bold text-black/55">multilinks-app.vercel.app/<span className="text-[#7055e8]">{normalizedUsername}</span></div>
        <Link href="/sign-in" className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 font-bold text-white transition hover:-translate-y-1">Quiero este enlace <ArrowRight size={19}/></Link></div>
      </div>
    </main>
  );
}
