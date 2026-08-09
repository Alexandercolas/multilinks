export type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  clicks?: number;
  icon?: string;
  sectionTitle?: string;
};

export type Profile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarImage?: string;
  theme: "lime" | "violet" | "sunset" | "neon";
  backgroundColor?: string;
  accentColor?: string;
  buttonStyle?: "rounded" | "pill" | "square";
  links: LinkItem[];
};
