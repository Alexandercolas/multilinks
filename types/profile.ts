export type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  clicks?: number;
};

export type Profile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarImage?: string;
  theme: "lime" | "violet" | "sunset";
  backgroundColor?: string;
  accentColor?: string;
  buttonStyle?: "rounded" | "pill" | "square";
  links: LinkItem[];
};
