"use client";
import Link from "next/link";
import {
  BarChart3,
  LayoutDashboard,
  Link2,
  Palette,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
export type DashboardSection = "resumen" | "perfil" | "apariencia" | "enlaces";
const sections = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "enlaces", label: "Enlaces", icon: Link2 },
] as const;
export function DashboardNavigation({
  isAdmin,
  activeSection,
  onSelect,
}: {
  isAdmin: boolean;
  activeSection: DashboardSection;
  onSelect: (section: DashboardSection) => void;
}) {
  const itemClass =
    "flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none lg:w-full";
  return (
    <nav
      aria-label="Secciones del panel"
      className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-white/10 bg-[#101010]/95 px-3 py-2 backdrop-blur-xl lg:fixed lg:bottom-0 lg:left-0 lg:top-[76px] lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-6"
    >
      <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white/50 lg:block">
        Tu página
      </p>
      {sections.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={activeSection === id ? "page" : undefined}
          aria-controls={id}
          onClick={() => onSelect(id)}
          className={`${itemClass} ${activeSection === id ? "bg-white/[.09] text-white" : "text-white/65 hover:bg-white/[.04] hover:text-white"}`}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </button>
      ))}
      <Link
        href="/dashboard/analytics"
        className={`${itemClass} text-white/65 hover:bg-white/[.04] hover:text-white`}
      >
        <BarChart3 size={17} aria-hidden="true" />
        Analytics
      </Link>
      <Link
        href="/dashboard/ajustes"
        className={`${itemClass} text-white/65 hover:bg-white/[.04] hover:text-white lg:mt-4 lg:border-t lg:border-white/10 lg:pt-3`}
      >
        <Settings size={17} aria-hidden="true" />
        Ajustes
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          className={`${itemClass} text-white/65 hover:bg-white/[.04] hover:text-white`}
        >
          <ShieldCheck size={17} aria-hidden="true" />
          Administrador
        </Link>
      )}
    </nav>
  );
}
