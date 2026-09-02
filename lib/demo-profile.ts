import type { Profile } from "@/types/profile";

export const demoProfile: Profile = {
  username: "demo",
  displayName: "MultiLinks",
  bio: "Contenido, proyectos y enlaces importantes en un solo lugar.",
  avatar: "ML",
  theme: "neon",
  backgroundColor: "#0f1115",
  accentColor: "#c6ff3d",
  buttonStyle: "rounded",
  links: [
    { id: "1", title: "Crear mi página", url: "/dashboard", active: true, icon: "✨", sectionTitle: "Empieza aquí", description: "Gratis y lista en minutos", featured: true },
    { id: "2", title: "Ver cómo funciona", url: "/", active: true, icon: "👀", sectionTitle: "Descubre MultiLinks" },
    { id: "3", title: "Mi comunidad", url: "/demo", active: true, icon: "🔗", sectionTitle: "Descubre MultiLinks" },
    {
      id: "4",
      title: "Mi playlist",
      url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      active: true,
      description: "Lo que estoy escuchando",
      sectionTitle: "Escucha",
      provider: "spotify",
      linkType: "media",
      thumbnail: "https://i.scdn.co/image/ab67706f0000000274dd48e99e097e3ee37133be",
    },
  ],
};

export const themeClasses = {
  lime: "bg-[#c9ff58] text-[#151515]",
  violet: "bg-[#8566ff] text-white",
  sunset: "bg-[#ff7356] text-[#1d1321]",
  neon: "bg-[#0f1115] text-[#e6e6e6]",
};
