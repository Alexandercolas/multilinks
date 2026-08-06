import type { Profile } from "@/types/profile";

export const demoProfile: Profile = {
  username: "demo",
  displayName: "MultiLinks",
  bio: "Contenido, proyectos y enlaces importantes en un solo lugar.",
  avatar: "ML",
  theme: "lime",
  backgroundColor: "#c9ff58",
  accentColor: "#8566ff",
  buttonStyle: "rounded",
  links: [
    { id: "1", title: "Crear mi página", url: "/dashboard", active: true, icon: "✨", sectionTitle: "Empieza aquí" },
    { id: "2", title: "Ver cómo funciona", url: "/", active: true, icon: "👀", sectionTitle: "Descubre MultiLinks" },
    { id: "3", title: "Mi comunidad", url: "/demo", active: true, icon: "🔗", sectionTitle: "Descubre MultiLinks" },
  ],
};

export const themeClasses = {
  lime: "bg-[#c9ff58] text-[#151515]",
  violet: "bg-[#8566ff] text-white",
  sunset: "bg-[#ff7356] text-[#1d1321]",
};
