import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

const serviceRoleKey = process.env.supabase_SUPABASE_SERVICE_ROLE_KEY ?? "";

export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server credentials are missing");
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
