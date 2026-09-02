export type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  clicks?: number;
  icon?: string;
  sectionTitle?: string;
  featured?: boolean;
};

export type Profile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarImage?: string;
  theme: "lime" | "violet" | "sunset" | "neon";
  backgroundColor?: string;
  backgroundPreset?: string;
  backgroundImage?: string;
  backgroundImagePath?: string;
  coverImage?: string;
  coverImagePath?: string;
  accentColor?: string;
  buttonStyle?: "rounded" | "pill" | "square";
  links: LinkItem[];
};
