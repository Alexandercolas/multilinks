import Link from "next/link";
import { ArrowRight, CircleCheck, LogIn, Pencil, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { Logo } from "@/components/logo";
import { ProfileCard } from "@/components/profile-card";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { ShareProfileButton } from "@/components/share-profile-button";
import { demoProfile } from "@/lib/demo-profile";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";
import { decodeStoredBackground, getPremiumBackground, isFreeBackground } from "@/lib/profile-backgrounds";

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

function isSocialWebView(userAgent: string) {
  return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|TikTok|musical_ly|BytedanceWebview/i.test(
    userAgent,
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [{ username }, requestHeaders] = await Promise.all([params, headers()]);
  const normalizedUsername = decodeURIComponent(username).toLowerCase();
  const inSocialWebView = isSocialWebView(
    requestHeaders.get("user-agent") ?? "",
  );
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,avatar_url,theme,background_color,accent_color,button_style")
    .eq("username", normalizedUsername)
    .eq("published", true)
    .maybeSingle<DbProfile>();

  if (data) {
    const [{ data: links }, { data: hasPro }, { data: authData }] = await Promise.all([
      supabase.from("links").select("id,title,url,active,icon,section_title").eq("profile_id", data.id).eq("active", true).order("position"),
      supabase.rpc("profile_has_pro", { target_profile: data.id }),
      supabase.auth.getUser(),
    ]);
    const isOwner = authData.user?.id === data.id;
    const storedBackground = decodeStoredBackground(data.background_color);
    const allowedPreset = hasPro || isFreeBackground(storedBackground.preset) ? storedBackground.preset : undefined;
    const profile: Profile = {
      username: data.username,
      displayName: data.display_name,
      bio: data.bio,
      avatar: data.display_name.slice(0, 2).toUpperCase(),
      avatarImage: data.avatar_url ?? undefined,
      theme: data.theme === "neon" && !hasPro ? "lime" : data.theme,
      backgroundColor: data.theme === "neon" && !hasPro ? "#c9ff58" : storedBackground.color,
      backgroundPreset: allowedPreset,
      accentColor: data.theme === "neon" && !hasPro ? "#8566ff" : data.accent_color,
      buttonStyle: data.button_style,
      links: (links ?? []).map((link) => ({ ...link, icon: link.icon ?? undefined, sectionTitle: link.section_title ?? undefined })),
    };
    const premiumDark = profile.theme === "neon" || Boolean(getPremiumBackground(profile.backgroundPreset)?.dark);
    const showWebViewSignIn = !authData.user && inSocialWebView;
    return (
      <main
        className={`min-h-screen px-4 py-5 sm:px-6 sm:py-7 ${premiumDark ? "bg-[#090b0d]" : "bg-cream"}`}
      >
        {!isOwner ? <ProfileViewTracker profileId={data.id} /> : null}
        <div
          className={`mx-auto mb-5 flex max-w-md animate-fade-up items-center gap-2 ${isOwner || showWebViewSignIn ? "justify-between" : "justify-end"}`}
        >
          {isOwner ? (
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${premiumDark ? "border border-lime/30 bg-lime/10 text-lime hover:border-lime/60" : "border-2 border-ink bg-lime text-ink shadow-[3px_3px_0_#151515]"}`}
            >
              <Pencil size={16} /> Editar mi perfil
            </Link>
          ) : showWebViewSignIn ? (
            <Link
              href="/sign-in?next=/dashboard"
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition hover:underline motion-reduce:transition-none ${premiumDark ? "text-white/45 hover:text-lime" : "text-ink/50 hover:text-ink"}`}
            >
              <LogIn size={13} /> ¿Eres tú? Inicia sesión para editar →
            </Link>
          ) : null}
          <ShareProfileButton title={profile.displayName} dark={premiumDark} />
        </div>
        <div
          className={`mx-auto max-w-md overflow-hidden rounded-[2.5rem] ${premiumDark ? "border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,.55)]" : "border-[3px] border-ink shadow-hard-lg"}`}
        >
          <ProfileCard profile={profile} />
        </div>
      </main>
    );
  }

  if (normalizedUsername === "demo") {
    return <main className="min-h-screen bg-[#090b0d] px-4 py-7 sm:px-6"><div className="mx-auto max-w-md overflow-hidden rounded-[2.5rem] border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,.55)]"><ProfileCard profile={demoProfile}/></div></main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6 text-center">
      <div className="relative max-w-lg animate-fade-up overflow-hidden rounded-[2.25rem] border-[3px] border-ink bg-white p-9 shadow-hard-lg sm:p-12">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[3px] border-ink bg-lime"/><div className="absolute -bottom-10 -left-10 h-28 w-28 rotate-12 border-[3px] border-ink bg-grape/20"/>
        <div className="relative"><Logo /><div className="mx-auto mt-8 inline-flex rotate-[-2deg] items-center gap-2 border-2 border-ink bg-lime px-4 py-2 font-display text-xs font-black shadow-hard"><CircleCheck size={18}/> Buena noticia</div>
        <Sparkles className="mx-auto mt-7 text-grape-dark" size={34}/>
        <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-.03em] sm:text-4xl">¡Este enlace puede ser tuyo!</h1>
        <p className="mx-auto mt-4 max-w-sm leading-7 text-black/60">El nombre <strong className="text-ink">@{normalizedUsername}</strong> está libre. Crea tu página, añade tus redes y compártela en minutos.</p>
        <div className="mt-6 rotate-[1deg] border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-black/55 shadow-[3px_3px_0_#151515]">multilinksrd.vercel.app/<span className="text-grape-dark">{normalizedUsername}</span></div>
        <Link href="/sign-in" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:shadow-hard">Quiero este enlace <ArrowRight size={19}/></Link></div>
      </div>
    </main>
  );
}
