import Link from "next/link";
import { ArrowUpRight, Pencil } from "lucide-react";
import { ProfileCard } from "@/components/profile-card";
import { ProfileShareTools } from "@/components/share-profile-button";
import { getPremiumBackground } from "@/lib/profile-backgrounds";
import type { Profile } from "@/types/profile";

export function PublicProfileShell({
  profile,
  url,
  qrSvg,
  isOwner = false,
  showBranding = true,
  richMedia = false,
}: {
  profile: Profile;
  url: string;
  qrSvg: string;
  isOwner?: boolean;
  showBranding?: boolean;
  richMedia?: boolean;
}) {
  const dark =
    Boolean(profile.backgroundImage) ||
    profile.theme === "neon" ||
    Boolean(getPremiumBackground(profile.backgroundPreset)?.dark);
  return (
    <main
      className={`min-h-screen px-3 pb-8 pt-4 sm:px-6 sm:py-8 ${dark ? "bg-surface text-white" : "bg-cream text-ink"}`}
    >
      <div className="mx-auto max-w-[620px] lg:max-w-[1020px]">
        {(showBranding || isOwner) && (
          <header className="mb-5 flex min-h-11 items-center justify-between gap-3 sm:mb-8">
            {showBranding ? (
              <Link
                href="/"
                aria-label="MultiLinks — inicio"
                className="profile-focus inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-tight"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 place-items-center rounded-lg font-display text-xs ${dark ? "bg-white text-ink" : "bg-ink text-white"}`}
                >
                  M
                </span>
                MultiLinks
              </Link>
            ) : (
              <span />
            )}
            {isOwner ? (
              <Link
                href="/dashboard"
                className="profile-control border-current/[.15]"
              >
                <Pencil aria-hidden="true" size={14} />
                Editar mi perfil
              </Link>
            ) : showBranding ? (
              <Link
                href="/sign-in?mode=signup"
                className="profile-focus inline-flex min-h-11 items-center gap-1 text-xs font-semibold"
              >
                Crear mi página
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            ) : null}
          </header>
        )}
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_216px] lg:items-start lg:gap-12">
          <div className="order-2 min-w-0 overflow-hidden rounded-[1.75rem] lg:order-1 sm:rounded-[2rem]">
            <ProfileCard
              profile={profile}
              showBranding={showBranding}
              richMedia={richMedia}
            />
          </div>
          <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-12 lg:pt-8">
            <ProfileShareTools
              title={profile.displayName}
              url={url}
              qrSvg={qrSvg}
              dark={dark}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
