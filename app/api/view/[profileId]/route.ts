import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return new Response(null, { status: 400 });
  const supabase = await createClient();
  await supabase.rpc("record_profile_view", { target_profile: profileId });
  return new Response(null, { status: 204 });
}
