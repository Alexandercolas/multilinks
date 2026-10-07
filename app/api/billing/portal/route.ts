import { createClient } from '@/lib/supabase/server';
import { lemonRequest } from '@/lib/lemon-squeezy';
import { safeLemonUrl } from '@/lib/billing-webhook';
export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await client.from('subscriptions').select('provider_subscription_id').eq('user_id', user.id).maybeSingle();
  if (!data?.provider_subscription_id) return Response.json({ error: 'No hay suscripción asociada.' }, { status: 404 });
  try {
    const subscription = await lemonRequest(`/subscriptions/${encodeURIComponent(data.provider_subscription_id)}`);
    const url = safeLemonUrl(subscription.data?.attributes?.urls?.customer_portal);
    if (!url) throw new Error('Portal unavailable');
    return new Response(null, { status: 303, headers: { Location: url, 'Cache-Control': 'private, no-store' } });
  } catch { return Response.json({ error: 'El portal no está disponible. Intenta de nuevo.' }, { status: 503 }); }
}
