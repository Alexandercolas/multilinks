import type { ProviderKind } from "@/lib/platforms";

export type SmartCardType = "standard" | "simple" | "media" | "featured" | "social" | "action";

/** Result of analysing a pasted URL. All strings are already sanitised. */
export type LinkPreview = {
  provider: string; // PlatformId, or "generic"
  kind: ProviderKind;
  cardType: SmartCardType;
  title: string;
  description: string;
  image: string; // https URL or ""
  favicon: string; // https URL or ""
  siteName: string;
};

export const CARD_TYPE_LABELS: Record<SmartCardType, string> = {
  standard: "Enlace",
  simple: "Compacto",
  media: "Multimedia",
  featured: "Destacado",
  social: "Social",
  action: "Contacto",
};

export const CARD_TYPE_OPTIONS: SmartCardType[] = [
  "standard",
  "simple",
  "media",
  "social",
  "action",
  "featured",
];
