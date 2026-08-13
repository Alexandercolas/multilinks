"use client";

import { useEffect, useState } from "react";
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

const sections = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "enlaces", label: "Enlaces", icon: Link2 },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
] as const;

type SectionId = (typeof sections)[number]["id"];

function findSection(id: SectionId) {
  return document.getElementById(id);
}

export function DashboardNavigation({ isAdmin }: { isAdmin: boolean }) {
  const [activeSection, setActiveSection] = useState<SectionId>("resumen");

  function goTo(id: SectionId) {
    setActiveSection(id);
    findSection(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    const elements = sections
      .map(({ id }) => findSection(id))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const match = sections.find(
            ({ id }) => findSection(id) === visible.target,
          );
          if (match) setActiveSection(match.id);
        }
      },
      { rootMargin: "-18% 0px -58% 0px", threshold: [0.05, 0.25, 0.5] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav
        aria-label="Secciones del panel"
        className="group/sidebar fixed left-4 top-1/2 z-40 hidden w-16 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-card/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,.42)] backdrop-blur-xl transition-[width] duration-300 hover:w-52 focus-within:w-52 lg:block motion-reduce:transition-none"
      >
        <div className="space-y-1">
          {sections.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? "location" : undefined}
                className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition motion-reduce:transition-none ${active ? "bg-lime text-ink shadow-[0_0_20px_rgba(201,255,88,.16)]" : "text-white/55 hover:bg-white/[.06] hover:text-white"}`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="whitespace-nowrap text-sm font-black opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 motion-reduce:transition-none">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {isAdmin ? (
          <div className="mt-2 border-t border-white/10 pt-2">
            <Link
              href="/admin"
              className="flex h-12 items-center gap-3 rounded-xl px-3 text-grape-light transition hover:bg-grape/15 hover:text-white motion-reduce:transition-none"
            >
              <ShieldCheck size={20} className="shrink-0" />
              <span className="whitespace-nowrap text-sm font-black opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100 motion-reduce:transition-none">
                Administrador
              </span>
            </Link>
          </div>
        ) : null}
      </nav>
      <nav
        aria-label="Navegación móvil del panel"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/15 bg-card/95 p-1.5 shadow-[0_20px_55px_rgba(0,0,0,.55)] backdrop-blur-xl lg:hidden"
      >
        {sections
          .filter(({ id }) => id !== "perfil")
          .map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? "location" : undefined}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-black transition motion-reduce:transition-none ${active ? "bg-lime text-ink" : "text-white/50 hover:text-white"}`}
              >
                <Icon size={18} />
                <span className="w-full truncate text-center">{label}</span>
              </button>
            );
          })}
        <Link
          href="/dashboard/ajustes"
          className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-black text-white/50 transition hover:bg-white/[.06] hover:text-white motion-reduce:transition-none"
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </Link>
      </nav>
    </>
  );
}
