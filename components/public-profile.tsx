"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile-card";
import { demoProfile } from "@/lib/demo-profile";
import { readStoredProfile } from "@/lib/profile-storage";
import type { Profile } from "@/types/profile";

export function PublicProfile({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null>(
    username === demoProfile.username ? demoProfile : null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored?.username === username) setProfile(stored);
    setReady(true);
  }, [username]);

  if (!ready) return <main className="min-h-screen bg-cream" />;
  if (profile) return <main className="min-h-screen"><ProfileCard profile={profile}/></main>;

  return <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <span className="rounded-full bg-lime px-4 py-2 text-sm font-black">NOMBRE DISPONIBLE</span>
    <h1 className="mt-5 text-4xl font-black tracking-tight">@{username} todavía está libre</h1>
    <p className="mt-3 max-w-md text-black/60">Crea tu página, agrega tus enlaces y comparte este nombre con el mundo.</p>
    <Link href="/dashboard" className="mt-7 rounded-full bg-ink px-6 py-3 font-bold text-white">Crear mi MultiLink</Link>
  </main>;
}
