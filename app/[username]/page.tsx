import Link from "next/link";
import { Logo } from "@/components/logo";
import { ProfileCard } from "@/components/profile-card";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
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
      .select("id,title,url,active")
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
      links: links ?? [],
    };
    return <main className="min-h-screen p-6"><ProfileViewTracker profileId={data.id} /><div className="mx-auto max-w-md"><ProfileCard profile={profile} /></div></main>;
  }

  if (normalizedUsername === "demo") {
    return <main className="min-h-screen p-6"><div className="mx-auto max-w-md"><ProfileCard profile={demoProfile} /></div></main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6ef] p-6 text-center">
      <div className="max-w-md rounded-[2rem] border-2 border-black bg-white p-10 shadow-[8px_8px_0_#8566ff]">
        <Logo />
        <h1 className="mt-8 text-3xl font-black">Este nombre está disponible</h1>
        <p className="mt-3 text-black/60">Crea tu cuenta y publica tu propia página MultiLinks.</p>
        <Link href="/sign-in" className="mt-7 inline-flex rounded-full bg-black px-6 py-3 font-bold text-white">Crear mi página</Link>
      </div>
    </main>
  );
}
