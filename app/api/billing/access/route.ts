import { createClient } from '@/lib/supabase/server';
export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await client.rpc('account_access');
  if (error) return Response.json({ error: 'No pudimos consultar tu plan.' }, { status: 503 });
  return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
