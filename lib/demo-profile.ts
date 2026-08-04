import type { Profile } from "@/types/profile";

export const demoProfile: Profile = {
  username: "demo",
  displayName: "Perfil Demo",
  bio: "Contenido, proyectos y enlaces importantes en un solo lugar.",
  avatar: "ML",
  theme: "lime",
  links: [
    { id: "1", title: "Crear mi página", url: "/dashboard", active: true },
    { id: "2", title: "Ver cómo funciona", url: "/", active: true },
    { id: "3", title: "Perfil de demostración", url: "/demo", active: true }
  ]
};

export const themeClasses = {
  lime: "bg-[#c9ff58] text-[#151515]",
  violet: "bg-[#8566ff] text-white",
  sunset: "bg-[#ff7356] text-[#1d1321]",
};
