export const supabaseUrl = process.env.NEXT_PUBLIC_supabase_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_supabase_SUPABASE_ANON_KEY
  ?? process.env.NEXT_PUBLIC_supabase_SUPABASE_PUBLISHABLE_KEY
  ?? "";

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
