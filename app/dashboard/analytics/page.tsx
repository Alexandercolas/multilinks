import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
export default async function AnalyticsPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/sign-in");
  return <main className="min-h-screen bg-ink px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="mb-7 inline-block text-sm text-lime">← Volver al dashboard</Link><AnalyticsDashboard /></div></main>;
}
