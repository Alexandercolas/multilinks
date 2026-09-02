export type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  clicks?: number;
  icon?: string;
  sectionTitle?: string;
  description?: string;
  featured?: boolean;
  provider?: string;
  linkType?: "standard" | "simple" | "media" | "featured" | "social" | "action";
  thumbnail?: string;
  faviconUrl?: string;
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
