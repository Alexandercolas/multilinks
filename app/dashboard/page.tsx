"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  Crown,
  Eye,
  GripVertical,
  ImagePlus,
  LogOut,
  MousePointerClick,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { ProfileCard } from "@/components/profile-card";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { demoProfile } from "@/lib/demo-profile";
import { isSafeLink } from "@/lib/profile-storage";
import { getLinkMedia } from "@/lib/link-media";
import { detectPlatform } from "@/lib/platforms";
import {
  BACKGROUND_IMAGE_BUCKET,
  decodeStoredBackground,
  encodeStoredBackground,
  premiumBackgrounds,
  premiumBackgroundStyle,
  isFreeBackground,
  isValidBackgroundImagePath,
} from "@/lib/profile-backgrounds";
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

type DbLink = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  clicks: number;
  icon: string | null;
  section_title: string | null;
};

const PRO_ACTIVE_LINK_LIMIT = 50;
const FREE_TRIAL_DAYS = 30;
const FREE_TRIAL_LINK_LIMIT = 3;
const FREE_BASE_LINK_LIMIT = 1;

function freeTrialInfo(createdAt?: string) {
  const created = createdAt ? new Date(createdAt).getTime() : Date.now();
  const daysSince = (Date.now() - created) / 86_400_000;
  const withinTrial = daysSince < FREE_TRIAL_DAYS;
  return {
    limit: withinTrial ? FREE_TRIAL_LINK_LIMIT : FREE_BASE_LINK_LIMIT,
    daysLeft: withinTrial ? Math.max(1, Math.ceil(FREE_TRIAL_DAYS - daysSince)) : 0,
  };
}

function linkLimitMessage(limit: number) {
  if (limit === PRO_ACTIVE_LINK_LIMIT) {
    return `El plan Pro permite hasta ${PRO_ACTIVE_LINK_LIMIT} enlaces activos.`;
  }
  if (limit === FREE_TRIAL_LINK_LIMIT) {
    return `El plan Gratis permite ${FREE_TRIAL_LINK_LIMIT} enlaces activos el primer mes. Activa Pro para hasta ${PRO_ACTIVE_LINK_LIMIT}.`;
  }
  return `El plan Gratis permite ${FREE_BASE_LINK_LIMIT} enlace activo. Activa Pro para hasta ${PRO_ACTIVE_LINK_LIMIT}.`;
}

const CURATED_PALETTES = [
  { name: "Nocturno lima", background: "#111510", accent: "#c9ff58" },
  { name: "Grafito grape", background: "#14131a", accent: "#9b83ff" },
  { name: "Teal profundo", background: "#0e1a1a", accent: "#5eead4" },
  { name: "Azul medianoche", background: "#101722", accent: "#7dd3fc" },
  { name: "Ciruela suave", background: "#1a1118", accent: "#f0a6c2" },
  { name: "Carbón cálido", background: "#191713", accent: "#e7c66b" },
] as const;

type SortableLinkRowProps = {
  link: LinkItem;
  reducedMotion: boolean;
  isPro: boolean;
  onUpdate: (id: string, change: Partial<LinkItem>) => void;
  onRemove: (id: string) => void;
};

function SortableLinkRow({
  link,
  reducedMotion,
  isPro,
  onUpdate,
  onRemove,
}: SortableLinkRowProps) {
  const media = getLinkMedia(link.url);
  const platform = detectPlatform(link.url);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: link.id,
    transition: reducedMotion
      ? null
      : { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: reducedMotion ? undefined : transition,
      }}
      className={`flex items-start gap-3 rounded-2xl border bg-white/[.025] p-3 ${isDragging ? "opacity-35" : "opacity-100"} ${isSafeLink(link.url) ? "border-white/10" : "border-red-400/60"}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reordenar ${link.title || "enlace"}`}
        className="mt-1 shrink-0 touch-none cursor-grab rounded-lg p-1 text-white/20 transition hover:bg-white/[.06] hover:text-white/55 active:cursor-grabbing motion-reduce:transition-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_1fr_90px]">
        <input
          value={link.title}
          aria-label="Título del enlace"
          placeholder="Título"
          onChange={(event) => onUpdate(link.id, { title: event.target.value })}
          className="min-w-0 rounded-lg border border-white/10 bg-white/[.045] px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-lime/70"
        />
        <input
          value={link.url}
          aria-label="Dirección del enlace"
          placeholder="https://..."
          onChange={(event) => onUpdate(link.id, { url: event.target.value })}
          className="min-w-0 rounded-lg border border-white/10 bg-white/[.045] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime/70"
        />
        <input
          value={link.icon ?? ""}
          maxLength={500}
          aria-label="Ícono del enlace"
          placeholder="Emoji o URL"
          onChange={(event) => onUpdate(link.id, { icon: event.target.value })}
          className="min-w-0 rounded-lg border border-white/10 bg-white/[.045] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime/70"
        />
        {platform || media?.kind === "youtube" ? (
          <div className="sm:col-span-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {platform ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-white/70"
                style={{ backgroundColor: `${platform.color}1f`, borderColor: `${platform.color}55` }}
              >
                <img
                  src={`https://cdn.simpleicons.org/${platform.slug}`}
                  alt=""
                  width="12"
                  height="12"
                  className="h-3 w-3 object-contain"
                />
                {platform.label}
              </span>
            ) : null}
            {media?.kind === "youtube" ? (
              <span className={`inline-flex items-center gap-1.5 ${isPro ? "text-lime" : "text-white/40"}`}>
                {isPro ? (
                  <>
                    <Check size={13} /> Miniatura activada
                  </>
                ) : (
                  <>
                    <Crown size={13} className="text-lime" /> Miniatura del video con Pro
                  </>
                )}
              </span>
            ) : null}
          </div>
        ) : null}
        <input
          value={link.sectionTitle ?? ""}
          maxLength={60}
          aria-label="Título de sección"
          placeholder="Sección opcional, por ejemplo: Mis redes"
          onChange={(event) =>
            onUpdate(link.id, { sectionTitle: event.target.value })
          }
          className="min-w-0 rounded-lg border border-white/10 bg-white/[.045] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime/70 sm:col-span-3"
        />
      </div>
      <button
        type="button"
        aria-label="Activar enlace"
        onClick={() => onUpdate(link.id, { active: !link.active })}
        className={`mt-2 h-6 w-11 shrink-0 rounded-full p-1 ${link.active ? "bg-lime" : "bg-white/15"}`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-card transition motion-reduce:transition-none ${link.active ? "translate-x-5" : ""}`}
        />
      </button>
      <button
        type="button"
        aria-label="Eliminar"
        onClick={() => onRemove(link.id)}
        className="mt-1 p-2 text-white/30 transition hover:text-red-300 motion-reduce:transition-none"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundError, setBackgroundError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [backgroundsOpen, setBackgroundsOpen] = useState(false);
  const [appearanceTab, setAppearanceTab] = useState<"fondo" | "botones">("fondo");
  const [totalViews, setTotalViews] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [freeLinkLimit, setFreeLinkLimit] = useState(FREE_TRIAL_LINK_LIMIT);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const supabase = createClient();
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: adminAccess } = await supabase.rpc("is_admin");
      setIsAdmin(Boolean(adminAccess));
      const [
        { data: dbProfile },
        { data: dbLinks },
        { data: viewRows },
        { data: subscription },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "username,display_name,bio,avatar_url,theme,background_color,accent_color,button_style",
          )
          .eq("id", user.id)
          .maybeSingle<DbProfile>(),
        supabase
          .from("links")
          .select("id,title,url,active,clicks,icon,section_title")
          .eq("profile_id", user.id)
          .order("position"),
        supabase
          .from("profile_daily_views")
          .select("views")
          .eq("profile_id", user.id),
        supabase
          .from("subscriptions")
          .select("plan_id,status")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setIsPro(
        Boolean(adminAccess) ||
          (subscription?.plan_id === "pro" &&
            ["active", "trialing"].includes(subscription.status)),
      );
      const trial = freeTrialInfo(user.created_at);
      setFreeLinkLimit(trial.limit);
      setTrialDaysLeft(trial.daysLeft);
      setTotalViews(
        (viewRows ?? []).reduce((total, row) => total + row.views, 0),
      );
      if (dbProfile) {
        const storedBackground = decodeStoredBackground(
          dbProfile.background_color,
        );
        const backgroundImagePath = isValidBackgroundImagePath(
          storedBackground.imagePath,
        )
          ? storedBackground.imagePath
          : undefined;
        setProfile({
          username: dbProfile.username,
          displayName: dbProfile.display_name,
          bio: dbProfile.bio,
          avatar: dbProfile.display_name.slice(0, 2).toUpperCase(),
          avatarImage: dbProfile.avatar_url ?? undefined,
          theme: dbProfile.theme,
          backgroundColor: storedBackground.color,
          backgroundPreset: storedBackground.preset,
          backgroundImagePath,
          backgroundImage: backgroundImagePath
            ? supabase.storage
                .from(BACKGROUND_IMAGE_BUCKET)
                .getPublicUrl(backgroundImagePath).data.publicUrl
            : undefined,
          accentColor: dbProfile.accent_color,
          buttonStyle: dbProfile.button_style,
          links: (dbLinks ?? []).map((link: DbLink) => ({
            id: link.id,
            title: link.title,
            url: link.url,
            active: link.active,
            clicks: link.clicks,
            icon: link.icon ?? undefined,
            sectionTitle: link.section_title ?? undefined,
          })),
        });
      } else {
        const base = (user.email?.split("@")[0] ?? "usuario")
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "")
          .slice(0, 24);
        setProfile({
          ...demoProfile,
          username: base.length >= 3 ? base : `user-${user.id.slice(0, 6)}`,
          displayName: "Mi perfil",
          links: [],
        });
      }
      setReady(true);
    }
    void loadProfile();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const updateLink = (id: string, change: Partial<LinkItem>) =>
    setProfile((p) => ({
      ...p,
      links: p.links.map((link) =>
        link.id === id ? { ...link, ...change } : link,
      ),
    }));
  const removeLink = (id: string) =>
    setProfile((current) => ({
      ...current,
      links: current.links.filter((link) => link.id !== id),
    }));
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveLinkId(String(active.id));
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveLinkId(null);
    if (!over || active.id === over.id) return;

    setProfile((current) => {
      const oldIndex = current.links.findIndex((link) => link.id === active.id);
      const newIndex = current.links.findIndex((link) => link.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      return { ...current, links: arrayMove(current.links, oldIndex, newIndex) };
    });
  };
  const activeLinkLimit = isPro ? PRO_ACTIVE_LINK_LIMIT : freeLinkLimit;
  const addLink = () => {
    if (
      profile.links.filter((link) => link.active).length >= activeLinkLimit
    ) {
      setMessage(linkLimitMessage(activeLinkLimit));
      return;
    }
    setProfile((p) => ({
      ...p,
      links: [
        ...p.links,
        {
          id: crypto.randomUUID(),
          title: "Nuevo enlace",
          url: "https://",
          active: true,
        },
      ],
    }));
  };

  function uploadPhoto(file?: File) {
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Selecciona una imagen válida.");
      return;
    }
    if (file.size > 1_000_000) {
      setPhotoError("La imagen debe pesar menos de 1 MB.");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      setProfile((p) => ({ ...p, avatarImage: String(reader.result) }));
    reader.onerror = () => setPhotoError("No pudimos leer la imagen.");
    reader.readAsDataURL(file);
  }

  function uploadBackground(file?: File) {
    setBackgroundError("");
    if (!file) return;
    if (!isPro) {
      setBackgroundError("La imagen de fondo propia es una función de MultiLinks Pro.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setBackgroundError("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 3_000_000) {
      setBackgroundError("La imagen debe pesar menos de 3 MB.");
      return;
    }
    setBackgroundFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      setProfile((p) => ({
        ...p,
        backgroundImage: String(reader.result),
        backgroundPreset: undefined,
        theme: "neon",
      }));
    reader.onerror = () => setBackgroundError("No pudimos leer la imagen.");
    reader.readAsDataURL(file);
  }

  function clearBackgroundImage() {
    setBackgroundFile(null);
    setBackgroundError("");
    setProfile((p) => ({
      ...p,
      backgroundImage: undefined,
      backgroundImagePath: undefined,
    }));
  }

  // Picking any color / preset background also drops a custom image so the two
  // never end up stored at the same time.
  function chooseColorBackground(changes: Partial<Profile>) {
    setBackgroundFile(null);
    setBackgroundError("");
    setProfile((p) => ({
      ...p,
      backgroundImage: undefined,
      backgroundImagePath: undefined,
      ...changes,
    }));
  }

  async function save() {
    if (profile.username.length < 3) {
      setMessage("El usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (profile.links.some((link) => !isSafeLink(link.url))) {
      setMessage("Corrige las direcciones marcadas en rojo.");
      return;
    }
    if (
      profile.links.filter((link) => link.active).length > activeLinkLimit
    ) {
      setMessage(linkLimitMessage(activeLinkLimit));
      return;
    }
    if (
      !isPro &&
      (profile.theme === "neon" ||
        profile.backgroundImage ||
        (profile.backgroundPreset && !isFreeBackground(profile.backgroundPreset)))
    ) {
      setMessage(
        "Los temas y fondos premium son exclusivos de MultiLinks Pro.",
      );
      return;
    }
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    let avatarUrl = profile.avatarImage;
    if (photoFile) {
      const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (uploadError) {
        setMessage("No pudimos subir la foto.");
        setSaving(false);
        return;
      }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path)
        .data.publicUrl;
    }

    let backgroundImagePath = profile.backgroundImagePath;
    if (backgroundFile) {
      const extension =
        backgroundFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        "jpg";
      const path = `${user.id}/background-${Date.now()}.${extension}`;
      const { error: backgroundUploadError } = await supabase.storage
        .from(BACKGROUND_IMAGE_BUCKET)
        .upload(path, backgroundFile, {
          upsert: true,
          contentType: backgroundFile.type,
        });
      if (backgroundUploadError) {
        setMessage("No pudimos subir la imagen de fondo.");
        setSaving(false);
        return;
      }
      if (profile.backgroundImagePath && profile.backgroundImagePath !== path) {
        await supabase.storage
          .from(BACKGROUND_IMAGE_BUCKET)
          .remove([profile.backgroundImagePath]);
      }
      backgroundImagePath = path;
    } else if (!profile.backgroundImage && profile.backgroundImagePath) {
      await supabase.storage
        .from(BACKGROUND_IMAGE_BUCKET)
        .remove([profile.backgroundImagePath]);
      backgroundImagePath = undefined;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      username: profile.username,
      display_name: profile.displayName,
      bio: profile.bio,
      avatar_url: avatarUrl?.startsWith("data:") ? null : (avatarUrl ?? null),
      theme: profile.theme,
      background_color: encodeStoredBackground(
        profile.backgroundColor,
        profile.backgroundPreset,
        backgroundImagePath,
      ),
      accent_color: profile.accentColor ?? "#8566ff",
      button_style: profile.buttonStyle ?? "rounded",
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      setMessage(
        profileError.code === "23505"
          ? "Ese nombre de usuario ya está ocupado."
          : profileError.code === "P0001"
            ? profileError.message
            : "No pudimos guardar el perfil.",
      );
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("links")
      .delete()
      .eq("profile_id", user.id);
    const rows = profile.links.map((link, position) => ({
      id: link.id,
      profile_id: user.id,
      title: link.title,
      url: link.url,
      active: link.active,
      position,
      clicks: link.clicks ?? 0,
      icon: link.icon?.trim() || null,
      section_title: link.sectionTitle?.trim() || null,
    }));
    const { error: linksError } = rows.length
      ? await supabase.from("links").insert(rows)
      : { error: null };
    if (deleteError || linksError) {
      setMessage("El perfil se guardó, pero algunos enlaces no.");
      setSaving(false);
      return;
    }

    setProfile({
      ...profile,
      avatarImage: avatarUrl?.startsWith("data:") ? undefined : avatarUrl,
      backgroundImagePath,
      backgroundImage: backgroundImagePath
        ? supabase.storage
            .from(BACKGROUND_IMAGE_BUCKET)
            .getPublicUrl(backgroundImagePath).data.publicUrl
        : undefined,
    });
    setPhotoFile(null);
    setBackgroundFile(null);
    setMessage("¡Cambios publicados!");
    setSaving(false);
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!ready) return <DashboardSkeleton />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-lime/10 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-56 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-grape/10 blur-3xl"
      />
      <header className="relative border-b border-white/10 bg-surface-header/80 px-4 py-3 backdrop-blur-xl lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Volver al inicio" className="text-white">
              <Logo />
            </Link>
            {isPro ? (
              <span className="rounded-full bg-gradient-to-r from-lime/55 to-grape/55 p-px">
                <span className="block rounded-full bg-surface-header px-2.5 py-1 font-display text-[9px] font-black tracking-[.18em] text-white">
                  PRO
                </span>
              </span>
            ) : null}
          </div>
          <nav
            aria-label="Acciones de la cuenta"
            className="flex items-center gap-2"
          >
            <Link
              href={`/${profile.username}`}
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-3 py-2.5 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(201,255,88,.15)] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Eye size={17} />
              <span className="hidden sm:inline">Ver mi perfil</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                aria-label="Abrir administrador"
                className="inline-flex items-center gap-2 rounded-xl border border-grape/35 bg-grape/15 p-2.5 text-grape-light transition hover:border-grape/65 hover:text-white lg:hidden motion-reduce:transition-none"
              >
                <ShieldCheck size={17} />
              </Link>
            ) : null}
            <button
              onClick={signOut}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="rounded-xl p-2.5 text-white/45 transition hover:bg-white/[.06] hover:text-white motion-reduce:transition-none"
            >
              <LogOut size={19} />
            </button>
          </nav>
        </div>
      </header>
      <DashboardNavigation isAdmin={isAdmin} />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-8 pb-28 lg:grid-cols-[1fr_410px] lg:pb-8 xl:pl-24">
        <section>
          <div
            id="resumen"
            className="mb-7 scroll-mt-24 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <p className="font-display text-xs font-black uppercase tracking-[.16em] text-lime">
                TU ESPACIO
              </p>
              <h1 className="mt-2 font-display text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">
                Personaliza tu página
              </h1>
            </div>
            <div className="text-right">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-lime px-6 py-3 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(201,255,88,.18)] disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
              >
                {saving ? "Publicando…" : "Guardar y publicar"}
              </button>
              {message ? (
                <p className="mt-2 max-w-xs rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/60">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
          <div
            id="estadisticas"
            className="mb-6 scroll-mt-24 grid gap-4 sm:grid-cols-2"
          >
            <StatCard
              icon={<Eye size={20} />}
              label="Visitas al perfil"
              value={totalViews}
            />
            <StatCard
              icon={<MousePointerClick size={20} />}
              label="Clics en enlaces"
              value={profile.links.reduce(
                (total, link) => total + (link.clicks ?? 0),
                0,
              )}
            />
          </div>
          {!isPro ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-lime/25 bg-lime/[.07] p-5 text-white shadow-[0_18px_55px_rgba(201,255,88,.07)]">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime">
                  <Crown size={21} />
                </span>
                <div>
                  <p className="font-display font-black text-white">
                    Desbloquea MultiLinks Pro
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    {trialDaysLeft > 0
                      ? `Te quedan ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"} con ${FREE_TRIAL_LINK_LIMIT} enlaces. Después, el plan Gratis permite ${FREE_BASE_LINK_LIMIT}.`
                      : `El plan Gratis permite ${FREE_BASE_LINK_LIMIT} enlace activo.`}
                    {" "}Pro llega a {PRO_ACTIVE_LINK_LIMIT}, con miniaturas de YouTube e imagen de fondo.
                  </p>
                </div>
              </div>
              <Link
                href="/planes"
                className="rounded-xl bg-lime px-5 py-3 text-sm font-black text-ink transition hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] motion-reduce:transition-none"
              >
                Ver planes
              </Link>
            </div>
          ) : null}
          <div
            id="perfil"
            className="scroll-mt-24 rounded-[2rem] border border-white/12 bg-card/95 p-6"
          >
            <h2 className="font-display text-lg font-black">Perfil</h2>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-lime/35 bg-lime text-xl font-black text-ink shadow-[0_0_24px_rgba(201,255,88,.16)]">
                {profile.avatarImage ? (
                  <div
                    role="img"
                    aria-label="Foto seleccionada"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${profile.avatarImage})` }}
                  />
                ) : (
                  profile.avatar
                )}
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[.045] px-4 py-2 text-sm font-bold text-white/70 transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">
                  <ImagePlus size={17} /> Subir foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => uploadPhoto(e.target.files?.[0])}
                  />
                </label>
                {profile.avatarImage ? (
                  <button
                    onClick={() => {
                      setProfile({ ...profile, avatarImage: undefined });
                      setPhotoFile(null);
                    }}
                    className="ml-2 text-sm font-semibold text-red-300"
                  >
                    Quitar
                  </button>
                ) : null}
                <p className="mt-2 text-xs text-white/35">
                  JPG, PNG o WebP · máximo 1 MB
                </p>
                {photoError ? (
                  <p className="mt-1 text-xs font-semibold text-red-300">
                    {photoError}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre"
                value={profile.displayName}
                onChange={(displayName) =>
                  setProfile({ ...profile, displayName })
                }
              />
              <Field
                label="Usuario"
                value={profile.username}
                onChange={(username) =>
                  setProfile({
                    ...profile,
                    username: username
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, ""),
                  })
                }
              />
            </div>
            <label className="mt-4 block text-sm font-bold text-white/75">
              Biografía
              <textarea
                maxLength={240}
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 font-normal text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"
              />
            </label>
          </div>
          <div
            id="apariencia"
            className="mt-6 scroll-mt-24 rounded-[2rem] border border-white/12 bg-card/95 p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-black">Apariencia</h2>
              {!isPro ? (
                <Link
                  href="/planes"
                  className="inline-flex items-center gap-1 text-xs font-black text-lime"
                >
                  <Crown size={14} /> Desbloquear Pro
                </Link>
              ) : null}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[.03] p-1">
              <button type="button" onClick={() => setAppearanceTab("fondo")} className={`rounded-lg px-3 py-2 text-sm font-black transition motion-reduce:transition-none ${appearanceTab === "fondo" ? "bg-white/[.08] text-white" : "text-white/45 hover:text-white/80"}`}>Fondo y color</button>
              <button type="button" onClick={() => setAppearanceTab("botones")} className={`rounded-lg px-3 py-2 text-sm font-black transition motion-reduce:transition-none ${appearanceTab === "botones" ? "bg-white/[.08] text-white" : "text-white/45 hover:text-white/80"}`}>Botones</button>
            </div>
            {appearanceTab === "fondo" ? (
            <>
            <div className="mt-6">
              <p className="text-sm font-bold text-white/75">Temas rápidos</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {(["lime", "violet", "sunset", "neon"] as const).map(
                  (theme) => {
                    const color =
                      theme === "lime"
                        ? "#c9ff58"
                        : theme === "violet"
                          ? "#8566ff"
                          : theme === "sunset"
                            ? "#ff7356"
                            : "#0f1115";
                    const locked = theme === "neon" && !isPro;
                    return (
                      <button
                        key={theme}
                        type="button"
                        aria-label={
                          locked
                            ? "Tema Neon Dark, disponible en Pro"
                            : `Tema ${theme}`
                        }
                        onClick={() =>
                          locked
                            ? setMessage(
                                "Neon Dark es un tema exclusivo de MultiLinks Pro.",
                              )
                            : chooseColorBackground({
                                theme,
                                backgroundPreset: undefined,
                                backgroundColor: color,
                                accentColor:
                                  theme === "neon"
                                    ? "#c6ff3d"
                                    : profile.accentColor,
                              })
                        }
                        className={`relative h-11 w-11 rounded-full border-2 transition motion-reduce:transition-none ${profile.theme === theme && !profile.backgroundPreset ? "border-lime ring-2 ring-lime/35 ring-offset-2 ring-offset-card" : "border-white/15 hover:border-white/35"}`}
                        style={{ backgroundColor: color }}
                      >
                        {locked ? (
                          <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-lime text-ink">
                            <Crown size={11} />
                          </span>
                        ) : null}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => setBackgroundsOpen((open) => !open)}
                aria-expanded={backgroundsOpen}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4 text-left transition hover:border-lime/35 motion-reduce:transition-none"
              >
                <span>
                  <span className="flex items-center gap-2 font-display text-sm font-black">
                    {isPro ? (
                      <Check size={16} className="text-lime" />
                    ) : (
                      <Crown size={16} className="text-lime" />
                    )}
                    Fondos Premium
                  </span>
                  <span className="mt-1 block text-xs text-white/35">
                    16 diseños · 1 gratis · toca para desplegar
                  </span>
                </span>
                <ChevronDown
                  size={20}
                  className={`text-white/45 transition motion-reduce:transition-none ${backgroundsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {backgroundsOpen ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {premiumBackgrounds.map((background) => {
                    const selected = profile.backgroundPreset === background.id;
                    const availableForFree = isFreeBackground(background.id);
                    return (
                      <button
                        key={background.id}
                        type="button"
                        onClick={() => {
                          if (!isPro && !availableForFree) {
                            setMessage(
                              "Los fondos Premium están disponibles con MultiLinks Pro.",
                            );
                            return;
                          }
                          chooseColorBackground({
                            theme: background.dark ? "neon" : "violet",
                            backgroundPreset: background.id,
                            backgroundColor: background.dark
                              ? "#0f1115"
                              : "#f7f4ed",
                            accentColor: background.dark
                              ? "#c6ff3d"
                              : "#8566ff",
                          });
                        }}
                        className={`group relative overflow-hidden rounded-2xl border-2 text-left transition hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-lime shadow-[0_0_24px_rgba(201,255,88,.18)]" : "border-white/10 hover:border-white/30"}`}
                      >
                        <span
                          className="block aspect-[9/13] bg-cover"
                          style={premiumBackgroundStyle(background.id)}
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-2 text-[10px] font-black text-white backdrop-blur-sm">
                          {background.name}
                        </span>
                        {!isPro && !availableForFree ? (
                          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
                            <Crown size={13} />
                          </span>
                        ) : !isPro && availableForFree ? (
                          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase text-ink">
                            Gratis
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between gap-4">
                <span>
                  <span className="flex items-center gap-2 font-display text-sm font-black">
                    {isPro ? (
                      <ImagePlus size={16} className="text-lime" />
                    ) : (
                      <Crown size={16} className="text-lime" />
                    )}
                    Imagen de fondo
                  </span>
                  <span className="mt-1 block text-xs text-white/35">
                    {isPro
                      ? "JPG, PNG o WebP · máximo 3 MB"
                      : "Sube tu propia imagen con MultiLinks Pro"}
                  </span>
                </span>
                {isPro ? (
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[.045] px-4 py-2 text-sm font-bold text-white/70 transition hover:border-lime/45 hover:text-lime motion-reduce:transition-none">
                    <ImagePlus size={16} />{" "}
                    {profile.backgroundImage ? "Cambiar" : "Subir"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => uploadBackground(e.target.files?.[0])}
                    />
                  </label>
                ) : (
                  <Link
                    href="/planes"
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-lime px-4 py-2 text-sm font-black text-ink transition hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] motion-reduce:transition-none"
                  >
                    <Crown size={14} /> Pro
                  </Link>
                )}
              </div>
              {profile.backgroundImage ? (
                <div className="mt-4 flex items-center gap-4">
                  <span
                    role="img"
                    aria-label="Imagen de fondo seleccionada"
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-cover bg-center"
                    style={{ backgroundImage: `url(${profile.backgroundImage})` }}
                  />
                  <button
                    type="button"
                    onClick={clearBackgroundImage}
                    className="text-sm font-semibold text-red-300"
                  >
                    Quitar imagen
                  </button>
                </div>
              ) : null}
              {backgroundError ? (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {backgroundError}
                </p>
              ) : null}
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-sm font-bold text-white/75">Paletas curadas</p>
              <p className="mt-1 text-xs text-white/35">
                Combinaciones equilibradas para mantener una presencia visual limpia.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {CURATED_PALETTES.map((palette) => {
                  const selected =
                    !profile.backgroundPreset &&
                    profile.backgroundColor?.toLowerCase() === palette.background &&
                    profile.accentColor?.toLowerCase() === palette.accent;

                  return (
                    <button
                      key={palette.name}
                      type="button"
                      title={palette.name}
                      aria-label={`Usar paleta ${palette.name}`}
                      aria-pressed={selected}
                      onClick={() =>
                        chooseColorBackground({
                          theme: "violet",
                          backgroundPreset: undefined,
                          backgroundColor: palette.background,
                          accentColor: palette.accent,
                        })
                      }
                      className={`relative h-11 w-11 overflow-hidden rounded-full border-2 transition hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-lime ring-2 ring-lime/35 ring-offset-2 ring-offset-card" : "border-white/15 hover:border-white/35"}`}
                    >
                      <span
                        className="absolute inset-0"
                        style={{
                          backgroundColor: palette.background,
                          clipPath: "polygon(0 0, 100% 0, 0 100%)",
                        }}
                        aria-hidden="true"
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          backgroundColor: palette.accent,
                          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                        }}
                        aria-hidden="true"
                      />
                      {selected ? (
                        <span className="absolute inset-0 grid place-items-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.8)]">
                          <Check size={15} strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[.12em] text-white/35">
                Personalizado
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Color de fondo"
                  value={profile.backgroundColor ?? "#c9ff58"}
                  onChange={(backgroundColor) =>
                    chooseColorBackground({
                      backgroundColor,
                      backgroundPreset: undefined,
                    })
                  }
                />
                <ColorField
                  label="Color de acento"
                  value={profile.accentColor ?? "#8566ff"}
                  onChange={(accentColor) =>
                    setProfile({ ...profile, accentColor })
                  }
                />
              </div>
            </div>
            </>
            ) : null}
            {appearanceTab === "botones" ? (
            <div className="mt-6">
              <p className="text-sm font-bold text-white/75">
                Forma de botones
              </p>
              <p className="mt-1 text-xs text-white/35">
                Aplica a todos los enlaces de tu página.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["rounded", "pill", "square"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() =>
                      setProfile({ ...profile, buttonStyle: style })
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs font-bold transition motion-reduce:transition-none ${profile.buttonStyle === style ? "border-lime/60 bg-lime/10 text-white" : "border-white/12 bg-white/[.03] text-white/55 hover:border-white/25 hover:text-white"}`}
                  >
                    <span
                      className={`h-7 w-full border ${style === "pill" ? "rounded-full" : style === "square" ? "rounded-md" : "rounded-xl"} ${profile.buttonStyle === style ? "border-lime/50 bg-lime/15" : "border-white/20 bg-white/[.05]"}`}
                    />
                    {style === "rounded"
                      ? "Redondeado"
                      : style === "pill"
                        ? "Cápsula"
                        : "Cuadrado"}
                  </button>
                ))}
              </div>
            </div>
            ) : null}
          </div>
          <div
            id="enlaces"
            className="mt-6 scroll-mt-24 rounded-[2rem] border border-white/12 bg-card/95 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-black">Mis enlaces</h2>
                <p className="mt-1 text-xs text-white/35">
                  Añade títulos de sección e íconos opcionales para organizar
                  mejor tu página.
                </p>
              </div>
              <button
                onClick={addLink}
                className="flex items-center gap-2 rounded-xl bg-lime px-4 py-2 text-sm font-black text-ink transition hover:shadow-[0_10px_26px_rgba(201,255,88,.16)] motion-reduce:transition-none"
              >
                <Plus size={17} /> Agregar
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragCancel={() => setActiveLinkId(null)}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={profile.links.map((link) => link.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-5 space-y-3">
                  {profile.links.map((link) => (
                    <SortableLinkRow
                      key={link.id}
                      link={link}
                      reducedMotion={reducedMotion}
                      isPro={isPro}
                      onUpdate={updateLink}
                      onRemove={removeLink}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
                {activeLinkId ? (
                  <div className="scale-[1.02] rounded-2xl border border-lime/35 bg-card/95 p-4 opacity-95 shadow-[0_24px_60px_rgba(0,0,0,.55)]">
                    <p className="truncate text-sm font-bold text-white">
                      {profile.links.find((link) => link.id === activeLinkId)
                        ?.title || "Enlace"}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/40">
                      {profile.links.find((link) => link.id === activeLinkId)
                        ?.url || ""}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </section>
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-white/30">
              Vista previa
            </p>
            <div className="mx-auto h-[720px] max-w-[390px] overflow-hidden rounded-[42px] border-[10px] border-card-border bg-card-border shadow-[0_30px_90px_rgba(0,0,0,.45)]">
              <div className="h-full overflow-y-auto rounded-[30px]">
                <ProfileCard profile={profile} preview showBranding={!isPro} richMedia={isPro} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold text-white/75">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 font-normal text-white outline-none placeholder:text-white/25 focus:border-lime/70 focus:bg-white/[.07]"
      />
    </label>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold text-white/75">
      {label}
      <span className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.045] p-2 focus-within:border-lime/70">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="font-mono text-xs font-normal uppercase text-white/45">
          {value}
        </span>
      </span>
    </label>
  );
}
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-card/95 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime">
        {icon}
      </span>
      <div>
        <p className="font-display text-2xl font-black text-white">
          {value.toLocaleString("es-DO")}
        </p>
        <p className="text-xs font-bold text-white/40">{label}</p>
      </div>
    </div>
  );
}
