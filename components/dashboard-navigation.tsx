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
const mobileSections = sections.filter(({ id }) => id !== "perfil");

type SectionId = (typeof sections)[number]["id"];

function findSection(id: SectionId) {
  return document.getElementById(id);
}

export function DashboardNavigation({ isAdmin }: { isAdmin: boolean }) {
  const [activeSection, setActiveSection] = useState<SectionId>("resumen");

  function goTo(id: SectionId) {
    setActiveSection(id);
    const section = findSection(id);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    section?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
    if (!reducedMotion) {
      section?.animate(
        [
          { opacity: 0.72, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      );
    }
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

  const desktopActiveIndex = sections.findIndex(
    ({ id }) => id === activeSection,
  );
  const mobileActiveIndex = mobileSections.findIndex(
    ({ id }) => id === activeSection,
  );

  return (
    <>
      <nav
        aria-label="Secciones del panel"
        className="group/sidebar fixed left-4 top-1/2 z-40 hidden w-16 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-card/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,.42)] backdrop-blur-xl transition-[width] duration-300 hover:w-52 focus-within:w-52 lg:block motion-reduce:transition-none"
      >
        <div className="relative space-y-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-12 rounded-xl bg-lime shadow-[0_0_20px_rgba(201,255,88,.16)] transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ transform: `translateY(${desktopActiveIndex * 52}px)` }}
          />
          {sections.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? "location" : undefined}
                className={`relative z-10 flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-[color,opacity,transform] duration-[180ms] ease-out hover:-translate-y-px motion-reduce:transform-none motion-reduce:transition-none ${active ? "text-ink" : "text-white/55 hover:text-white"}`}
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
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%_-_0.75rem)/5)] rounded-xl bg-lime transition-[transform,opacity] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${mobileActiveIndex < 0 ? "opacity-0" : "opacity-100"}`}
          style={{ transform: `translateX(${Math.max(mobileActiveIndex, 0) * 100}%)` }}
        />
        {mobileSections.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? "location" : undefined}
                className={`relative z-10 flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-black transition-colors duration-[180ms] ease-out motion-reduce:transition-none ${active ? "text-ink" : "text-white/50 hover:text-white"}`}
              >
                <Icon size={18} />
                <span className="w-full truncate text-center">{label}</span>
              </button>
            );
          })}
        <Link
          href="/dashboard/ajustes"
          className="relative z-10 flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-black text-white/50 transition-colors duration-[180ms] ease-out hover:bg-white/[.06] hover:text-white motion-reduce:transition-none"
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </Link>
      </nav>
    </>
  );
}
