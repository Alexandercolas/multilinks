export type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
};

export type Profile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  theme: "lime" | "violet" | "sunset";
  links: LinkItem[];
};
