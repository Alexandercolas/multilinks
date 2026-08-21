import { ArrowUpRight, Flag } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types/profile";
import { themeClasses } from "@/lib/demo-profile";
import { isSafeLink } from "@/lib/profile-storage";
import { LinkFavicon } from "@/components/link-favicon";
import { accessibleProfileTextColor, getPremiumBackground, premiumBackgroundStyle } from "@/lib/profile-backgrounds";

export function ProfileCard({ profile, preview = false, showBranding = true }: { profile: Profile; preview?: boolean; showBranding?: boolean }) {
  const buttonRadius = profile.buttonStyle === "pill" ? "rounded-full" : profile.buttonStyle === "square" ? "rounded-md" : "rounded-2xl";
  const visibleLinks = profile.links.filter((link) => link.active && isSafeLink(link.url));
  const selectedBackground = getPremiumBackground(profile.backgroundPreset);
  const profileTextColor = selectedBackground
    ? selectedBackground.dark ? "#ffffff" : "#151515"
    : accessibleProfileTextColor(profile.backgroundColor);
  const darkSurface = profileTextColor === "#ffffff";
  const backgroundColor = selectedBackground
    ? selectedBackground.dark ? "#0f1115" : "#f7f4ed"
    : profile.backgroundColor;

  return (
    <section
      className={`relative min-h-full overflow-hidden ${themeClasses[profile.theme]} px-5 py-10 text-center sm:px-7 sm:py-12`}
      style={{ backgroundColor, color: profileTextColor, ...premiumBackgroundStyle(profile.backgroundPreset) }}
    >
      {profile.backgroundPreset ? <span className={`absolute inset-0 ${darkSurface ? "bg-black/30" : "bg-white/15"}`} aria-hidden="true"/> : darkSurface ? <><span className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-lime/20 blur-3xl" aria-hidden="true"/><span className="absolute -right-24 top-72 h-72 w-72 rounded-full bg-lime/10 blur-3xl" aria-hidden="true"/><span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.06),transparent_42%)]" aria-hidden="true"/></> : <><span className="absolute left-3 top-28 h-16 w-16 rotate-12 border-[3px] border-ink bg-white/20 sm:left-5 sm:h-20 sm:w-20" aria-hidden="true"/><span className="absolute right-3 top-10 h-20 w-20 rounded-full border-[3px] border-ink opacity-30 sm:right-5 sm:h-24 sm:w-24" style={{ backgroundColor: profile.accentColor }} aria-hidden="true"/></>}

      <div className="relative mx-auto max-w-md">
        <div className="animate-fade-up">
          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center overflow-hidden font-display text-2xl font-black transition ${darkSurface ? "rounded-full border border-lime/60 text-ink shadow-[0_0_0_7px_rgba(198,255,61,.08),0_0_35px_rgba(198,255,61,.28)]" : "rotate-[-3deg] rounded-[2rem] border-[3px] border-ink bg-white text-ink shadow-hard-lg hover:rotate-0"}`}
            style={{ backgroundColor: darkSurface ? "#c6ff3d" : profile.accentColor }}
          >
            {profile.avatarImage ? (
              <div
                role="img"
                aria-label={`Foto de ${profile.displayName}`}
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${profile.avatarImage})` }}
              />
            ) : profile.avatar || profile.displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:80ms]">
          <h1 className="mt-7 font-display text-3xl font-black leading-tight tracking-[-.03em] sm:text-4xl">
            {profile.displayName}
          </h1>
          <p className={`mt-3 inline-flex items-center px-3 py-1 font-display text-xs font-bold ${darkSurface ? "" : "rotate-[-1deg] border-2 border-ink bg-white text-ink shadow-[3px_3px_0_#151515]"}`}>
            @{profile.username}
          </p>
        </div>

        <p className="mx-auto mt-6 max-w-sm animate-fade-up text-base font-semibold leading-7 [animation-delay:160ms]">
          {profile.bio}
        </p>

        <div className="mx-auto mt-9 max-w-md space-y-4">
          {visibleLinks.map((link, index) => {
            const trackable = /^[0-9a-f-]{36}$/i.test(link.id);
            const href = preview ? undefined : trackable ? `/api/click/${link.id}` : link.url;
            const showSection = link.sectionTitle && (index === 0 || visibleLinks[index - 1]?.sectionTitle !== link.sectionTitle);

            return (
              <div
                key={link.id}
                className="animate-fade-up"
                style={{ animationDelay: `${240 + index * 80}ms` }}
              >
                {showSection ? (
                  <h2 className="mb-3 mt-8 flex items-center justify-center gap-2 font-display text-xs font-black uppercase tracking-[.16em]">
                    <span className="h-2 w-2 rotate-45 bg-current" aria-hidden="true" />
                    {link.sectionTitle}
                    <span className="h-2 w-2 rotate-45 bg-current" aria-hidden="true" />
                  </h2>
                ) : null}
                <a
                  href={href}
                  target={!preview ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`group relative flex w-full items-center gap-3 overflow-hidden ${buttonRadius} px-4 py-3.5 text-left font-bold transition hover:-translate-y-1 ${darkSurface ? "border border-white/15 bg-black/20 text-white shadow-[0_12px_32px_rgba(0,0,0,.32)] hover:border-lime/60 hover:bg-black/10" : "border-[3px] border-ink bg-white text-ink shadow-hard hover:shadow-hard-lg"}`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 ${darkSurface ? "w-0.5" : "w-2 border-r-2 border-ink"}`}
                    style={{ backgroundColor: profile.accentColor }}
                    aria-hidden="true"
                  />
                  {link.icon && !["🔗", "ðŸ”—"].includes(link.icon) ? (
                    <span className={`ml-1 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-xl ${darkSurface ? "border border-white/10 bg-white/[.05]" : "border-2 border-ink bg-cream"}`}>
                      {/^https?:\/\//i.test(link.icon) ? (
                        <span
                          role="img"
                          aria-label="Icono del enlace"
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${link.icon})` }}
                        />
                      ) : link.icon}
                    </span>
                  ) : <span className={`ml-1 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl ${darkSurface ? "border border-white/10 bg-white/[.05]" : "border-2 border-ink bg-cream"}`}><LinkFavicon url={link.url} title={link.title}/></span>}
                  <span className="min-w-0 flex-1">{link.title}</span>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${darkSurface ? "border border-white/15 text-lime" : ""}`}><ArrowUpRight size={19}/></span>
                </a>
              </div>
            );
          })}
        </div>

        {!preview && showBranding ? <Link href="/sign-in?mode=signup" className={`group mx-auto mt-12 inline-flex animate-fade-up items-center gap-2 rounded-full px-4 py-2 font-display text-[10px] font-black uppercase tracking-[.08em] transition hover:-translate-y-0.5 [animation-delay:520ms] motion-reduce:transform-none motion-reduce:transition-none ${darkSurface ? "border border-white/15 hover:border-lime hover:text-lime" : "border-2 border-current hover:bg-white hover:text-grape-dark"}`}><span className={darkSurface ? "text-lime" : "text-grape-dark"} aria-hidden="true">✦</span> Crea tu MultiLinks gratis <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"/></Link> : null}
        {!preview ? <div className="mt-5 flex items-center justify-center gap-4 text-xs font-bold"><Link href={`/report/${profile.username}`} className="inline-flex items-center gap-1.5 hover:underline"><Flag size={13}/> Reportar</Link><Link href="/ayuda" className="hover:underline">Ayuda</Link></div> : null}
      </div>
    </section>
  );
}
