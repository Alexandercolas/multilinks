import { notFound } from "next/navigation";
import { ProfileCard } from "@/components/profile-card";
import { demoProfile } from "@/lib/demo-profile";
export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) { const { username } = await params; if (username !== demoProfile.username) notFound(); return <main className="min-h-screen"><ProfileCard profile={demoProfile}/></main>; }
