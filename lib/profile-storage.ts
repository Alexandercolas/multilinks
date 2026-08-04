import type { Profile } from "@/types/profile";

export const PROFILE_STORAGE_KEY = "multilinks-profile:v1";
const LEGACY_KEY = "multilinks-profile";

export function readStoredProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!value) return null;
    if (!window.localStorage.getItem(PROFILE_STORAGE_KEY)) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, value);
      window.localStorage.removeItem(LEGACY_KEY);
    }
    return JSON.parse(value) as Profile;
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: Profile) {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function isSafeLink(url: string) {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
