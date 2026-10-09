import { ArrowUpRight, Flag, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Profile } from "@/types/profile";
import { themeClasses } from "@/lib/demo-profile";
import { isSafeLink } from "@/lib/profile-storage";
import { getLinkMedia } from "@/lib/link-media";
import { detectPlatform, isSocialProfileLink } from "@/lib/platforms";
import { embedInfoFor } from "@/lib/media-embed";
import { LinkFavicon } from "@/components/link-favicon";
import { MediaEmbed } from "@/components/media-embed";
import { MediaArtwork } from "@/components/media-artwork";
import {
  accessibleProfileTextColor,
  backgroundImageStyle,
  getPremiumBackground,
  premiumBackgroundStyle,
} from "@/lib/profile-backgrounds";

// The icon field is meant to hold an emoji or an image URL (the dashboard's
// own placeholder says so), but some legacy links have a stray plain word in
// there instead (e.g. "Instagram") -- render that as text and it overflows
// the icon tile. Only trust it when it actually looks like one of the two.
function isDisplayableIcon(value: string): boolean {
  return /^https?:\/\//i.test(value) || Array.from(value).length <= 4;
}

export function ProfileCard({
  profile,
  preview = false,
  showBranding = true,
  richMedia = false,
}: {
  profile: Profile;
  preview?: boolean;
  showBranding?: boolean;
  richMedia?: boolean;
}) {
  const buttonRadius =
    profile.buttonStyle === "pill"
      ? "rounded-full"
      : profile.buttonStyle === "square"
        ? "rounded-lg"
        : "rounded-2xl";
  // Cards with an image / stacked content can't be pill-shaped or they turn into ellipses.
  const cardRadius =
    profile.buttonStyle === "square" ? "rounded-xl" : "rounded-2xl";
  const visibleLinks = profile.links.filter(
    (link) => link.active && isSafeLink(link.url),
  );
  // Network profiles belong below the identity, including legacy standard links.
  const socialLinks = visibleLinks.filter(isSocialProfileLink);
  const listLinks = visibleLinks
    .filter((link) => !isSocialProfileLink(link))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  const customImage = profile.backgroundImage;
  const selectedBackground = getPremiumBackground(profile.backgroundPreset);
  const texturedBackground = Boolean(
    customImage || (selectedBackground && !("gradient" in selectedBackground)),
  );
  const profileTextColor = customImage
    ? "#ffffff"
    : selectedBackground
      ? selectedBackground.dark
        ? "#ffffff"
        : "#151515"
      : accessibleProfileTextColor(profile.backgroundColor);
  const darkSurface = profileTextColor === "#ffffff";
  const backgroundColor = customImage
    ? "#0f1115"
    : selectedBackground
      ? selectedBackground.dark
        ? "#0f1115"
        : "#f7f4ed"
      : profile.backgroundColor;

  // One premium surface language, tuned for light vs dark backgrounds.
  const cardSurface =
    texturedBackground && darkSurface
      ? "border border-white/[.12] bg-[#111111]/95 text-white backdrop-blur-md hover:border-white/25 hover:bg-[#191919]"
      : darkSurface
        ? "border border-white/[.10] bg-[#141414] text-white hover:border-white/25 hover:bg-[#1c1c1c]"
        : "border border-black/[.08] bg-white/95 text-ink hover:border-black/[.18] hover:bg-white";
  const iconTile = darkSurface
    ? "border border-white/10 bg-white/[.06]"
    : "border border-black/[.06] bg-black/[.03]";

  return (
    <section
      className={`relative min-h-full overflow-hidden ${themeClasses[profile.theme]} px-5 py-8 text-center sm:px-9 sm:py-10`}
      style={{
        backgroundColor,
        color: profileTextColor,
        ...premiumBackgroundStyle(profile.backgroundPreset),
        ...backgroundImageStyle(customImage),
      }}
    >
      {customImage ? (
        <span
          className="absolute inset-0 bg-gradient-to-b from-black/[.06] via-transparent to-black/10"
          aria-hidden="true"
        />
      ) : profile.backgroundPreset ? (
        <span
          className={`absolute inset-0 ${darkSurface ? "bg-black/[.06]" : "bg-white/10"}`}
          aria-hidden="true"
        />
      ) : darkSurface ? (
        <span
          className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,.07),transparent_60%)]"
          aria-hidden="true"
        />
      ) : null}

      {profile.coverImage ? (
        <div
          role="img"
          aria-label={`Portada de ${profile.displayName}`}
          className="relative -mx-5 -mt-8 mb-3 h-36 bg-cover bg-center sm:-mx-9 sm:-mt-10 sm:h-44"
          style={{ backgroundImage: `url(${profile.coverImage})` }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-black/[.06] to-black/25"
          />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-xl">
        <header
          className={
            texturedBackground
              ? `rounded-2xl p-5 backdrop-blur-md ${darkSurface ? "bg-black/[.65]" : "bg-white/[.85]"}`
              : undefined
          }
        >
          <div className={`${profile.coverImage ? "-mt-14 sm:-mt-16" : ""}`}>
            <div
              className={`mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-[1.5rem] font-display text-2xl font-black ${profile.coverImage ? (darkSurface ? "ring-[3px] ring-[#141414]" : "ring-[3px] ring-white") : darkSurface ? "ring-1 ring-white/20" : "ring-1 ring-black/10"}`}
              style={{
                backgroundColor: profile.accentColor ?? "#c9ff58",
                color: accessibleProfileTextColor(profile.accentColor),
              }}
            >
              {profile.avatarImage ? (
                <Image
                  unoptimized
                  src={profile.avatarImage}
                  alt={`Foto de ${profile.displayName}`}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                profile.avatar || profile.displayName.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          <div className="mt-5">
            <h1 className="break-words [overflow-wrap:anywhere] font-display text-[1.75rem] font-bold leading-[1.2] tracking-[-.03em] sm:text-[1.875rem]">
              {profile.displayName}
            </h1>
            <p className="mt-2 break-all text-[13px] font-medium">
              @{profile.username}
            </p>
          </div>

          {profile.bio ? (
            <p
              className={`mx-auto mt-4 max-w-[34ch] whitespace-pre-line break-words [overflow-wrap:anywhere] text-[15px] leading-6 sm:max-w-md sm:text-sm`}
            >
              {profile.bio}
            </p>
          ) : null}
        </header>
        {socialLinks.length ? (
          <nav
            aria-label="Redes sociales"
            className="mx-auto mt-5 flex max-w-sm flex-row flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3"
          >
            {socialLinks.map((link) => {
              const trackable = /^[0-9a-f-]{36}$/i.test(link.id);
              const href = preview
                ? undefined
                : trackable
                  ? `/api/click/${link.id}`
                  : link.url;
              const customIcon =
                link.icon &&
                !["🔗", "ðŸ”—"].includes(link.icon) &&
                isDisplayableIcon(link.icon)
                  ? link.icon
                  : null;
              const faviconSrc =
                !customIcon &&
                link.faviconUrl &&
                /^(https:\/\/|\/api\/img\?)/i.test(link.faviconUrl)
                  ? link.faviconUrl
                  : undefined;
              const platform = customIcon ? null : detectPlatform(link.url);
              return (
                <a
                  key={link.id}
                  data-analytics-link={
                    !preview && trackable ? link.id : undefined
                  }
                  href={href}
                  target={!preview ? "_blank" : undefined}
                  rel="noreferrer"
                  title={link.title}
                  aria-label={link.title}
                  className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden profile-link rounded-xl border text-lg hover:-translate-y-px motion-reduce:transform-none ${platform ? "" : iconTile}`}
                  style={
                    platform
                      ? {
                          backgroundColor: `${platform.color}14`,
                          borderColor: `${platform.color}40`,
                        }
                      : undefined
                  }
                >
                  {customIcon ? (
                    /^https?:\/\//i.test(customIcon) ? (
                      <span
                        role="img"
                        aria-label="Icono del enlace"
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${customIcon})` }}
                      />
                    ) : (
                      customIcon
                    )
                  ) : (
                    <LinkFavicon
                      url={link.url}
                      title={link.title}
                      src={faviconSrc}
                    />
                  )}
                </a>
              );
            })}
          </nav>
        ) : null}

        <div className="mx-auto mt-6 max-w-xl space-y-2.5 sm:mt-7">
          {listLinks.map((link, index) => {
            const trackable = /^[0-9a-f-]{36}$/i.test(link.id);
            const href = preview
              ? undefined
              : trackable
                ? `/api/click/${link.id}`
                : link.url;
            const showSection =
              link.sectionTitle &&
              (index === 0 ||
                listLinks[index - 1]?.sectionTitle !== link.sectionTitle);
            const media = richMedia ? getLinkMedia(link.url) : null;
            const persistedThumb =
              link.thumbnail &&
              /^(https:\/\/|\/api\/img\?)/i.test(link.thumbnail)
                ? link.thumbnail
                : null;
            const urlThumb = media?.kind === "youtube" ? media.thumbnail : null;
            const mediaThumb = richMedia ? (persistedThumb ?? urlThumb) : null;
            const brandedMedia = media?.kind === "branded" ? media : null;
            const customIcon =
              link.icon &&
              !["🔗", "ðŸ”—"].includes(link.icon) &&
              isDisplayableIcon(link.icon)
                ? link.icon
                : null;
            const detectedPlatform = detectPlatform(link.url);
            const platform = customIcon ? null : detectedPlatform;
            const platformKind = detectedPlatform?.kind;
            const featured = Boolean(link.featured);
            const iconSizeClass = "h-9 w-9 text-base";

            // Decide the card shape from the persisted type, falling back to detection.
            const linkType =
              link.linkType ?? (brandedMedia ? "action" : "standard");
            const isMediaKind =
              linkType === "media" ||
              platformKind === "video" ||
              platformKind === "music";
            // Official embed (Spotify/YouTube/SoundCloud/Apple Music/Deezer/Vimeo iframe),
            // click-to-play. A platform can be embeddable even before it has a saved
            // thumbnail (Deezer/Apple Music have no oEmbed), so this doesn't require mediaThumb.
            const embed =
              richMedia && isMediaKind
                ? embedInfoFor(link.url, detectedPlatform?.id)
                : null;
            // The big image card is for video/music with a thumbnail, or anything we can embed.
            const showMediaCard =
              isMediaKind && (Boolean(mediaThumb) || Boolean(embed));
            const actionPlatform = brandedMedia?.platform ?? detectedPlatform;
            const actionLabel =
              brandedMedia?.action ??
              (actionPlatform?.id === "whatsapp"
                ? "Contactar"
                : actionPlatform?.id === "telegram"
                  ? "Abrir en Telegram"
                  : actionPlatform?.id === "discord"
                    ? "Unirse al servidor"
                    : actionPlatform?.id === "twitch"
                      ? "Ver canal"
                      : "Abrir enlace");
            const showActionCard =
              !showMediaCard &&
              Boolean(actionPlatform) &&
              (linkType === "action" || Boolean(brandedMedia));
            const showPlayButton =
              platformKind === "video" || platformKind === "music";

            const faviconSrc =
              !customIcon &&
              link.faviconUrl &&
              /^(https:\/\/|\/api\/img\?)/i.test(link.faviconUrl)
                ? link.faviconUrl
                : undefined;
            const iconSlot = customIcon ? (
              <span
                className={`grid shrink-0 place-items-center overflow-hidden rounded-xl ${iconSizeClass} ${iconTile}`}
              >
                {/^https?:\/\//i.test(customIcon) ? (
                  <span
                    role="img"
                    aria-label="Icono del enlace"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${customIcon})` }}
                  />
                ) : (
                  customIcon
                )}
              </span>
            ) : (
              <span
                className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border ${iconSizeClass} ${platform ? "" : iconTile}`}
                style={
                  platform
                    ? {
                        backgroundColor: `${platform.color}14`,
                        borderColor: `${platform.color}40`,
                      }
                    : undefined
                }
              >
                <LinkFavicon
                  url={link.url}
                  title={link.title}
                  src={faviconSrc}
                />
              </span>
            );

            const rowInner = (
              <>
                {iconSlot}
                <span className="min-w-0 flex-1">
                  <span
                    className="block break-words [overflow-wrap:anywhere] text-[15px] font-semibold leading-snug"
                  >
                    {link.title}
                  </span>
                  {link.description ? (
                    <span
                      className={`mt-1 block break-words [overflow-wrap:anywhere] text-[13px] font-normal leading-5 ${darkSurface ? "text-white/75" : "text-ink/75"}`}
                    >
                      {link.description}
                    </span>
                  ) : null}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  size={15}
                  className={`shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${darkSurface ? "text-white/40" : "text-ink/35"}`}
                />
              </>
            );

            return (
              <div key={link.id} data-analytics-link={link.id}>
                {showSection ? (
                  <h2 className="mb-2.5 mt-7 text-center font-display text-[11px] font-black uppercase tracking-[.18em]">
                    {link.sectionTitle}
                  </h2>
                ) : null}
                {showMediaCard ? (
                  <div
                    className={`group relative flex w-full flex-col overflow-hidden profile-link hover:-translate-y-px motion-reduce:transform-none ${cardRadius} ${cardSurface}`}
                  >
                    {embed ? (
                      <MediaEmbed
                        embed={embed}
                        thumbnail={mediaThumb}
                        title={link.title}
                        label={detectedPlatform?.label ?? "el enlace"}
                        externalHref={href ?? link.url}
                        rounded=""
                        dark={darkSurface}
                        linkId={!preview && trackable ? link.id : undefined}
                      />
                    ) : mediaThumb ? (
                      <a
                        href={href}
                        target={!preview ? "_blank" : undefined}
                        rel="noreferrer"
                        className="profile-link relative block w-full"
                        aria-label={`Abrir ${link.title}`}
                      >
                        <span className="relative block aspect-video w-full">
                          <MediaArtwork
                            src={mediaThumb}
                            kind={platformKind === "music" ? "audio" : "video"}
                          />
                        </span>
                        {showPlayButton ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink transition group-hover:scale-[1.03] motion-reduce:transition-none"
                            >
                              <Play
                                aria-hidden="true"
                                size={18}
                                className="translate-x-0.5 fill-current"
                              />
                            </span>
                          </>
                        ) : null}
                      </a>
                    ) : null}
                    <a
                      href={href}
                      target={!preview ? "_blank" : undefined}
                      rel="noreferrer"
                      className="profile-link flex min-h-[64px] items-center gap-3 px-3.5 py-3 text-left transition hover:bg-black/[.02] motion-reduce:transform-none"
                    >
                      {rowInner}
                    </a>
                  </div>
                ) : showActionCard && actionPlatform ? (
                  <a
                    href={href}
                    target={!preview ? "_blank" : undefined}
                    rel="noreferrer"
                    className={`profile-link group flex min-h-[64px] w-full min-w-0 items-center gap-3 ${cardRadius} px-3.5 py-3 text-left ${cardSurface}`}
                  >
                    {iconSlot}
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[15px] font-semibold">
                        {link.title}
                      </span>
                      <span
                        className={`mt-1 block break-words text-xs leading-5 ${darkSurface ? "text-white/80" : "text-ink/75"}`}
                      >
                        {link.description || actionLabel}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={17}
                      className="shrink-0"
                    />
                  </a>
                ) : (
                  <a
                    href={href}
                    target={!preview ? "_blank" : undefined}
                    rel="noreferrer"
                    className={`profile-link group relative flex min-h-[64px] w-full min-w-0 items-center gap-3 overflow-hidden ${featured ? cardRadius : buttonRadius} px-3.5 py-3 text-left hover:-translate-y-px motion-reduce:transform-none ${cardSurface}`}
                  >
                    {rowInner}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {showBranding || !preview ? (
          <footer
            className={`mt-10 border-t border-current/[.15] pt-6 ${texturedBackground ? `rounded-xl p-4 backdrop-blur-md ${darkSurface ? "bg-black/[.65]" : "bg-white/[.85]"}` : ""}`}
          >
            {showBranding &&
              (preview ? (
                <span className="text-xs font-semibold">
                  MultiLinks · Crea tu propia página
                </span>
              ) : (
                <Link
                  href="/"
                  className="profile-focus inline-flex min-h-11 flex-col items-center justify-center gap-1 text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span aria-hidden="true" className="font-display">
                      M
                    </span>
                    MultiLinks
                  </span>
                </Link>
              ))}
            {!preview && (
              <Link
                href="/sign-in?mode=signup"
                className={`profile-focus mx-auto mt-3 flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${darkSurface ? "border-white/20 bg-[#141414] text-white hover:bg-[#202020]" : "border-black/15 bg-white/95 text-ink hover:bg-white"}`}
              >
                Crear mi perfil
                <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
            )}
          </footer>
        ) : null}
        {!preview ? (
          <div
            className={`mt-5 flex items-center justify-center gap-4 rounded-xl text-xs font-medium ${texturedBackground ? (darkSurface ? "bg-black/[.65] backdrop-blur-md" : "bg-white/[.85] backdrop-blur-md") : ""} `}
          >
            <Link
              href={`/report/${profile.username}`}
              className="profile-focus inline-flex min-h-11 items-center gap-1.5 transition hover:opacity-100 hover:underline"
            >
              <Flag aria-hidden="true" size={12} /> Reportar
            </Link>
            <Link
              href="/ayuda"
              className="profile-focus inline-flex min-h-11 items-center transition hover:underline"
            >
              Ayuda
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
