"use client";

import { useEffect } from "react";

export function ProfileViewTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    const key = `multilinks-view-${profileId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch(`/api/view/${profileId}`, { method: "POST", keepalive: true });
  }, [profileId]);
  return null;
}
