import type { Profile } from "@/types/profile";

export const demoProfile: Profile = {
  username: "alex",
  displayName: "Alex Colas",
  bio: "Construyendo proyectos, comunidades y buenas ideas desde RD 🇩🇴",
  avatar: "AC",
  theme: "lime",
  links: [
    { id: "1", title: "Mi portafolio", url: "https://example.com", active: true },
    { id: "2", title: "Instagram", url: "https://instagram.com", active: true },
    { id: "3", title: "Ozama Chess", url: "https://example.com/ozama", active: true }
  ]
};

export const themeClasses = {
  lime: "bg-[#c9ff58] text-[#151515]",
  violet: "bg-[#8566ff] text-white",
  sunset: "bg-[#ff7356] text-[#1d1321]",
};
