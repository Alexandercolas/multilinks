import { ArrowUpRight, Flag, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types/profile";
import { themeClasses } from "@/lib/demo-profile";
import { isSafeLink } from "@/lib/profile-storage";

export function ProfileCard({ profile, preview = false }: { profile: Profile; preview?: boolean }) {
  const buttonRadius = profile.buttonStyle === "pill" ? "rounded-full" : profile.buttonStyle === "square" ? "rounded-md" : "rounded-2xl";
  const visibleLinks = profile.links.filter((link) => link.active && isSafeLink(link.url));

  return (
    <section
      className={`relative min-h-full overflow-hidden ${themeClasses[profile.theme]} px-5 py-10 text-center sm:px-7 sm:py-12`}
      style={{ backgroundColor: profile.backgroundColor }}
    >
      <span className="absolute -left-8 top-24 h-24 w-24 rotate-12 border-[3px] border-ink bg-white/20" aria-hidden="true" />
      <span
        className="absolute -right-10 top-6 h-28 w-28 rounded-full border-[3px] border-ink opacity-40"
        style={{ backgroundColor: profile.accentColor }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-md">
        <div className="animate-fade-up">
          <div
            className="mx-auto flex h-28 w-28 rotate-[-3deg] items-center justify-center overflow-hidden rounded-[2rem] border-[3px] border-ink bg-white font-display text-2xl font-black text-ink shadow-hard-lg transition hover:rotate-0"
            style={{ backgroundColor: profile.accentColor }}
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
          <p className="mt-3 inline-flex rotate-[-1deg] items-center border-2 border-ink bg-white px-3 py-1 font-display text-xs font-bold text-ink shadow-[3px_3px_0_#151515]">
            @{profile.username}
          </p>
        </div>

        <p className="mx-auto mt-6 max-w-sm animate-fade-up text-base font-semibold leading-7 opacity-80 [animation-delay:160ms]">
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
                  <h2 className="mb-3 mt-8 flex items-center justify-center gap-2 font-display text-xs font-black uppercase tracking-[.16em] opacity-75">
                    <span className="h-2 w-2 rotate-45 bg-current" aria-hidden="true" />
                    {link.sectionTitle}
                    <span className="h-2 w-2 rotate-45 bg-current" aria-hidden="true" />
                  </h2>
                ) : null}
                <a
                  href={href}
                  target={!preview ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`group relative flex w-full items-center gap-3 overflow-hidden ${buttonRadius} border-[3px] border-ink bg-white px-4 py-3.5 text-left font-bold text-ink shadow-hard transition hover:-translate-y-1 hover:shadow-hard-lg`}
                >
                  <span
                    className="absolute inset-y-0 left-0 w-2 border-r-2 border-ink"
                    style={{ backgroundColor: profile.accentColor }}
                    aria-hidden="true"
                  />
                  {link.icon ? (
                    <span className="ml-1 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-cream text-xl">
                      {/^https?:\/\//i.test(link.icon) ? (
                        <span
                          role="img"
                          aria-label="Icono del enlace"
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${link.icon})` }}
                        />
                      ) : link.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">{link.title}</span>
                  <ArrowUpRight className="shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={19} />
                </a>
              </div>
            );
          })}
        </div>

        {!preview ? (
          <div className="pin mx-auto mt-16 max-w-md animate-fade-up rotate-[1deg] border-[3px] border-ink bg-white p-6 text-ink shadow-hard-lg [animation-delay:520ms]">
            <Sparkles className="mx-auto text-grape-dark" size={24} />
            <p className="mt-3 font-display text-sm font-black">¿Te gustó esta página?</p>
            <p className="mt-2 text-sm leading-6 opacity-65">Reúne tus redes, proyectos y contactos en un solo enlace.</p>
            <Link
              href="/sign-in"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-hard"
            >
              Crea tu propio MultiLinks gratis <ArrowUpRight size={17} />
            </Link>
          </div>
        ) : null}

        <p className="mt-10 font-display text-xs font-black tracking-[.16em] opacity-55">
          MULTI<span className="text-grape-dark">//</span>LINKS
        </p>
        {!preview ? <div className="mt-5 flex items-center justify-center gap-4 text-xs font-bold opacity-60"><Link href={`/report/${profile.username}`} className="inline-flex items-center gap-1.5 hover:underline"><Flag size={13}/> Reportar</Link><Link href="/ayuda" className="hover:underline">Ayuda</Link></div> : null}
      </div>
    </section>
  );
}
