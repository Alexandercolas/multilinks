"use client";
import { useEffect } from "react";

export function ProfileViewTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    const send = (heartbeat: boolean) => {
      if (document.visibilityState !== "visible") return;
      void fetch(`/api/view/${profileId}`, {
        method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: window.location.pathname + window.location.search, referrer: document.referrer, heartbeat }),
      }).catch(() => {});
    };
    send(false);
    const seen = new Set<string>();
    const pending = new Set<string>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const href = (entry.target as HTMLAnchorElement).getAttribute("href") ?? "";
        const id = href.split("/").pop() ?? "";
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !seen.has(id)) { seen.add(id); pending.add(id); }
      }
    }, { threshold: 0.5 });
    document.querySelectorAll('a[href^="/api/click/"]').forEach(element => observer.observe(element));
    const flush = setInterval(() => {
      if (!pending.size) return;
      const links = [...pending].slice(0, 50); links.forEach(id => pending.delete(id));
      void fetch(`/api/impressions/${profileId}`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links }) }).catch(() => {});
    }, 2000);
    const interval = setInterval(() => send(true), 60000);
    return () => { clearInterval(interval); clearInterval(flush); observer.disconnect(); };
  }, [profileId]);
  return null;
}
