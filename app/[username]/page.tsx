import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { PublicProfileShell } from "@/components/public-profile-shell";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { publicProfileUrl } from "@/lib/public-profile-url";
import { demoProfile } from "@/lib/demo-profile";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";
import {
  BACKGROUND_IMAGE_BUCKET,
  decodeStoredBackground,
  isFreeBackground,
  isValidBackgroundImagePath,
} from "@/lib/profile-backgrounds";
import { proxiedImageUrl } from "@/lib/security/image-proxy";
import { generateProfileQr } from "@/lib/qr";

type DbProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: Profile["theme"];
  background_color: string;
  cover_image: string | null;
  accent_color: string;
  button_style: Profile["buttonStyle"];
};

// SEO real, pagina por pagina (encontrado auditando Search Console:
// 7 de 9 URLs sin indexar) -- antes esta pagina no tenia metadata
// propia, asi que TODOS los perfiles publicos heredaban el mismo
// title/description/canonical del layout raiz (apuntando al home).
// Google las veia como duplicados entre si, nunca como paginas
// propias que indexar. Consulta liviana y separada de la del
// componente de pagina (aceptamos la query extra a proposito, en vez
// de tocar el fetch mas grande que ya existe mas abajo).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const normalizedUsername = decodeURIComponent(username).toLowerCase();

  if (normalizedUsername === "demo") {
    return {
      title: demoProfile.displayName,
      description: demoProfile.bio,
      alternates: { canonical: "/demo" },
      openGraph: {
        title: demoProfile.displayName,
        description: demoProfile.bio,
        url: "/demo",
      },
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username,display_name,bio")
    .eq("username", normalizedUsername)
    .eq("published", true)
    .maybeSingle<{
      username: string;
      display_name: string | null;
      bio: string | null;
    }>();

  // Username sin perfil publicado: nunca hubo pagina real que
  // indexar aca -- noindex explicito para que Google no la trate como
  // contenido delgado/duplicado en vez de simplemente ignorarla.
  if (!data) {
    return {
      title: "Página no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const title = data.display_name?.trim() || `@${data.username}`;
  const description =
    data.bio?.trim() || `La página de enlaces de ${title} en MultiLinks.`;
  const canonicalPath = `/${data.username}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { title, description, url: canonicalPath, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const normalizedUsername = decodeURIComponent(username).toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id,username,display_name,bio,avatar_url,theme,background_color,cover_image,accent_color,button_style",
    )
    .eq("username", normalizedUsername)
    .eq("published", true)
    .maybeSingle<DbProfile>();

  if (data) {
    const [
      { data: links },
      { data: hasPro },
      { data: linkLimit },
      { data: authData },
    ] = await Promise.all([
      supabase
        .from("links")
        .select(
          "id,title,url,active,icon,section_title,description,featured,provider,link_type,thumbnail,metadata",
        )
        .eq("profile_id", data.id)
        .eq("active", true)
        .order("position"),
      supabase.rpc("profile_has_pro", { target_profile: data.id }),
      supabase.rpc("profile_effective_link_limit", { target_profile: data.id }),
      supabase.auth.getUser(),
    ]);
    const effectiveLinkLimit = typeof linkLimit === "number" ? linkLimit : 1;
    const isOwner = authData.user?.id === data.id;
    const storedBackground = decodeStoredBackground(data.background_color);
    const allowedPreset =
      hasPro || isFreeBackground(storedBackground.preset)
        ? storedBackground.preset
        : undefined;
    const allowedImage =
      hasPro && isValidBackgroundImagePath(storedBackground.imagePath)
        ? supabase.storage
            .from(BACKGROUND_IMAGE_BUCKET)
            .getPublicUrl(storedBackground.imagePath).data.publicUrl
        : undefined;
    const allowedCover =
      hasPro && isValidBackgroundImagePath(data.cover_image)
        ? supabase.storage
            .from(BACKGROUND_IMAGE_BUCKET)
            .getPublicUrl(data.cover_image).data.publicUrl
        : undefined;
    const downgraded =
      !hasPro && (data.theme === "neon" || Boolean(storedBackground.imagePath));
    const profile: Profile = {
      username: data.username,
      displayName: data.display_name,
      bio: data.bio,
      avatar: data.display_name.slice(0, 2).toUpperCase(),
      avatarImage: data.avatar_url ?? undefined,
      theme: downgraded ? "lime" : data.theme,
      backgroundColor: downgraded ? "#c9ff58" : storedBackground.color,
      backgroundPreset: allowedPreset,
      backgroundImage: allowedImage,
      coverImage: allowedCover,
      accentColor: downgraded ? "#8566ff" : data.accent_color,
      buttonStyle: data.button_style,
      links: (links ?? []).slice(0, effectiveLinkLimit).map((link) => ({
        ...link,
        icon: link.icon ?? undefined,
        sectionTitle: link.section_title ?? undefined,
        description: link.description ?? undefined,
        featured: Boolean(link.featured),
        provider: link.provider ?? undefined,
        linkType: link.link_type ?? undefined,
        thumbnail: proxiedImageUrl(link.thumbnail) || undefined,
        faviconUrl:
          proxiedImageUrl(
            (link.metadata as { favicon?: string } | null)?.favicon,
          ) || undefined,
      })),
    };
    // JSON-LD por perfil (pedido explicito): un "Person" real con los
    // mismos datos que ya se muestran en la pagina -- nada inventado.
    // undefined se omite solo del JSON final (bio/avatar pueden faltar
    // en perfiles nuevos), asi que es seguro no chequearlos antes.
    const profileUrl = await publicProfileUrl(profile.username);
    const profileJsonLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: profile.displayName,
        alternateName: profile.username,
        description: profile.bio || undefined,
        image: profile.avatarImage || undefined,
        url: profileUrl,
      },
    };
    const qrSvg = await generateProfileQr(profileUrl);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(profileJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {!isOwner ? <ProfileViewTracker profileId={data.id} /> : null}
        <PublicProfileShell
          profile={profile}
          url={profileUrl}
          qrSvg={qrSvg}
          isOwner={isOwner}
          showBranding={!hasPro}
          richMedia={Boolean(hasPro)}
        />
      </>
    );
  }

  if (normalizedUsername === "demo") {
    const url = await publicProfileUrl(demoProfile.username);
    return (
      <PublicProfileShell
        profile={demoProfile}
        url={url}
        qrSvg={await generateProfileQr(url)}
        richMedia
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6 text-center">
      <div className="relative max-w-lg animate-fade-up overflow-hidden rounded-[2rem] border border-black/[.06] bg-white p-9 shadow-[0_2px_8px_rgba(21,21,21,.04),0_36px_70px_-28px_rgba(21,21,21,.22)] sm:p-12">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-lime/25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-grape/20 blur-3xl"
        />
        <div className="relative">
          <Logo />
          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-lime/15 px-3.5 py-1.5 font-display text-xs font-black text-grape-dark">
            <CircleCheck size={16} /> Buena noticia
          </div>
          <Sparkles className="mx-auto mt-7 text-grape-dark" size={30} />
          <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-.03em] sm:text-4xl">
            ¡Este enlace puede ser tuyo!
          </h1>
          <p className="mx-auto mt-4 max-w-sm leading-7 text-black/55">
            El nombre{" "}
            <strong className="text-ink">@{normalizedUsername}</strong> está
            libre. Crea tu página, añade tus redes y compártela en minutos.
          </p>
          <div className="mt-6 rounded-xl border border-black/[.07] bg-cream px-4 py-3 text-sm font-semibold text-black/55">
            multilinksrd.vercel.app/
            <span className="text-grape-dark">{normalizedUsername}</span>
          </div>
          <Link
            href="/sign-in"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Quiero este enlace <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}
