import { ArrowUpRight, Flag, Play } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types/profile";
import { themeClasses } from "@/lib/demo-profile";
import { isSafeLink } from "@/lib/profile-storage";
import { getLinkMedia } from "@/lib/link-media";
import { detectPlatform } from "@/lib/platforms";
import { LinkFavicon } from "@/components/link-favicon";
import { accessibleProfileTextColor, backgroundImageStyle, getPremiumBackground, premiumBackgroundStyle } from "@/lib/profile-backgrounds";

export function ProfileCard({ profile, preview = false, showBranding = true, richMedia = false }: { profile: Profile; preview?: boolean; showBranding?: boolean; richMedia?: boolean }) {
  const buttonRadius = profile.buttonStyle === "pill" ? "rounded-full" : profile.buttonStyle === "square" ? "rounded-lg" : "rounded-2xl";
  const visibleLinks = profile.links.filter((link) => link.active && isSafeLink(link.url));
  const customImage = profile.backgroundImage;
  const selectedBackground = getPremiumBackground(profile.backgroundPreset);
  const profileTextColor = customImage
    ? "#ffffff"
    : selectedBackground
      ? selectedBackground.dark ? "#ffffff" : "#151515"
      : accessibleProfileTextColor(profile.backgroundColor);
  const darkSurface = profileTextColor === "#ffffff";
  const backgroundColor = customImage
    ? "#0f1115"
    : selectedBackground
      ? selectedBackground.dark ? "#0f1115" : "#f7f4ed"
      : profile.backgroundColor;

  // One premium surface language, tuned for light vs dark backgrounds.
  const cardSurface = darkSurface
    ? "border border-white/12 bg-white/[.06] text-white backdrop-blur-md hover:border-white/25 hover:bg-white/[.09]"
    : "border border-black/[.07] bg-white text-ink shadow-[0_1px_2px_rgba(21,21,21,.04),0_12px_32px_-16px_rgba(21,21,21,.16)] hover:border-black/[.14]";
  const iconTile = darkSurface
    ? "border border-white/10 bg-white/[.06]"
    : "border border-black/[.06] bg-black/[.03]";

  return (
    <section
      className={`relative min-h-full overflow-hidden ${themeClasses[profile.theme]} px-5 py-11 text-center sm:px-8 sm:py-14`}
      style={{ backgroundColor, color: profileTextColor, ...premiumBackgroundStyle(profile.backgroundPreset), ...backgroundImageStyle(customImage) }}
    >
      {customImage ? (
        <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/60" aria-hidden="true" />
      ) : profile.backgroundPreset ? (
        <span className={`absolute inset-0 ${darkSurface ? "bg-black/25" : "bg-white/10"}`} aria-hidden="true" />
      ) : darkSurface ? (
        <span className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,.07),transparent_60%)]" aria-hidden="true" />
      ) : null}

      {profile.coverImage ? (
        <div
          role="img"
          aria-label={`Portada de ${profile.displayName}`}
          className="relative -mx-5 -mt-11 mb-3 h-28 bg-cover bg-center sm:-mx-8 sm:-mt-14 sm:h-36"
          style={{ backgroundImage: `url(${profile.coverImage})` }}
        >
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/[.06] to-black/25" />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-md">
        <div className={`animate-fade-up ${profile.coverImage ? "-mt-14 sm:-mt-16" : ""}`}>
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] font-display text-2xl font-black ${profile.coverImage ? (darkSurface ? "ring-[3px] ring-[#141414]" : "ring-[3px] ring-white") : darkSurface ? "ring-1 ring-white/20 shadow-[0_10px_40px_-8px_rgba(0,0,0,.5)]" : "ring-1 ring-black/[.06] shadow-[0_12px_40px_-12px_rgba(21,21,21,.28)]"}`}
            style={{ backgroundColor: darkSurface ? "#c6ff3d" : profile.accentColor, color: "#151515" }}
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
          <h1 className="mt-6 font-display text-[1.75rem] font-black leading-tight tracking-[-.02em] sm:text-3xl">
            {profile.displayName}
          </h1>
          <p className={`mt-2 font-display text-sm font-bold ${darkSurface ? "text-white/55" : "text-ink/45"}`}>
            @{profile.username}
          </p>
        </div>

        {profile.bio ? (
          <p className={`mx-auto mt-5 max-w-sm animate-fade-up text-[15px] leading-7 [animation-delay:160ms] ${darkSurface ? "text-white/75" : "text-ink/70"}`}>
            {profile.bio}
          </p>
        ) : null}

        <div className="mx-auto mt-8 max-w-md space-y-3">
          {visibleLinks.map((link, index) => {
            const trackable = /^[0-9a-f-]{36}$/i.test(link.id);
            const href = preview ? undefined : trackable ? `/api/click/${link.id}` : link.url;
            const showSection = link.sectionTitle && (index === 0 || visibleLinks[index - 1]?.sectionTitle !== link.sectionTitle);
            const media = richMedia ? getLinkMedia(link.url) : null;
            const youtubeThumb = media?.kind === "youtube" ? media.thumbnail : null;
            const customIcon = link.icon && !["🔗", "ðŸ”—"].includes(link.icon) ? link.icon : null;
            const platform = customIcon ? null : detectPlatform(link.url);
            const featured = Boolean(link.featured);
            const iconSizeClass = featured ? "h-12 w-12 text-xl" : "h-10 w-10 text-lg";

            const iconSlot = customIcon ? (
              <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl ${iconSizeClass} ${iconTile}`}>
                {/^https?:\/\//i.test(customIcon) ? (
                  <span
                    role="img"
                    aria-label="Icono del enlace"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${customIcon})` }}
                  />
                ) : customIcon}
              </span>
            ) : (
              <span
                className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border ${iconSizeClass} ${platform ? "" : iconTile}`}
                style={platform ? { backgroundColor: `${platform.color}14`, borderColor: `${platform.color}40` } : undefined}
              >
                <LinkFavicon url={link.url} title={link.title} />
              </span>
            );

            const rowInner = (
              <>
                {iconSlot}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${featured ? "text-base font-black" : "text-[15px] font-semibold"}`}>{link.title}</span>
                  {link.description ? (
                    <span className={`mt-0.5 block truncate text-xs font-medium ${darkSurface ? "text-white/50" : "text-ink/45"}`}>{link.description}</span>
                  ) : null}
                </span>
                <ArrowUpRight size={featured ? 19 : 17} className={`shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${darkSurface ? "text-white/40" : "text-ink/35"}`} />
              </>
            );

            return (
              <div
                key={link.id}
                className="animate-fade-up"
                style={{ animationDelay: `${220 + index * 70}ms` }}
              >
                {showSection ? (
                  <h2 className={`mb-2.5 mt-7 text-center font-display text-[11px] font-black uppercase tracking-[.18em] ${darkSurface ? "text-white/45" : "text-ink/40"}`}>
                    {link.sectionTitle}
                  </h2>
                ) : null}
                {youtubeThumb ? (
                  <a
                    href={href}
                    target={!preview ? "_blank" : undefined}
                    rel="noreferrer"
                    className={`group relative flex w-full flex-col overflow-hidden ${buttonRadius} text-left transition hover:-translate-y-0.5 motion-reduce:transform-none ${cardSurface}`}
                  >
                    <span className="relative block w-full">
                      <span
                        role="img"
                        aria-label={`Miniatura de ${link.title}`}
                        className="block aspect-video w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${youtubeThumb})` }}
                      />
                      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-lg transition group-hover:scale-105 motion-reduce:transition-none">
                        <Play size={18} className="translate-x-0.5 fill-current" />
                      </span>
                    </span>
                    <span className={`flex items-center gap-3 px-3.5 ${featured ? "py-4" : "py-3"}`}>{rowInner}</span>
                  </a>
                ) : (
                  <a
                    href={href}
                    target={!preview ? "_blank" : undefined}
                    rel="noreferrer"
                    className={`group relative flex w-full items-center gap-3 overflow-hidden ${buttonRadius} text-left transition hover:-translate-y-0.5 motion-reduce:transform-none ${featured ? "px-4 py-5" : "px-3.5 py-3"} ${cardSurface}`}
                    style={featured ? { boxShadow: `inset 0 0 0 1px ${profile.accentColor}40` } : undefined}
                  >
                    <span
                      className={`absolute inset-y-2 left-0 rounded-full ${featured ? "w-1" : "w-[3px]"}`}
                      style={{ backgroundColor: profile.accentColor }}
                      aria-hidden="true"
                    />
                    {rowInner}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {showBranding ? (() => {
          const brandingClass = `mx-auto mt-10 inline-flex animate-fade-up items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-[.12em] transition [animation-delay:520ms] motion-reduce:transform-none motion-reduce:transition-none ${darkSurface ? "border border-white/12 text-white/60" : "border border-ink/12 text-ink/50"}`;
          const mark = <span className={darkSurface ? "text-lime" : "text-grape-dark"} aria-hidden="true">⚡</span>;
          return preview
            ? <span className={brandingClass}>{mark} Hecho con MultiLinks</span>
            : <Link href="/sign-in?mode=signup" className={`${brandingClass} hover:-translate-y-0.5 ${darkSurface ? "hover:border-lime/40 hover:text-lime" : "hover:border-ink/30 hover:text-grape-dark"}`}>{mark} Hecho con MultiLinks</Link>;
        })() : null}
        {!preview ? (
          <div className={`mt-5 flex items-center justify-center gap-4 text-xs font-semibold ${darkSurface ? "text-white/40" : "text-ink/40"}`}>
            <Link href={`/report/${profile.username}`} className="inline-flex items-center gap-1.5 transition hover:opacity-100 hover:underline"><Flag size={12} /> Reportar</Link>
            <Link href="/ayuda" className="transition hover:underline">Ayuda</Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
