import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { BILLING_EVENTS, subscriptionSnapshot, verifyWebhookSignature, webhookSubscriptionId } from '@/lib/billing-webhook';
import { billingConfiguration, lemonRequest } from '@/lib/lemon-squeezy';
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length')) > 1000000) return NextResponse.json({ error: 'Payload demasiado grande' }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 1000000) return NextResponse.json({ error: 'Payload demasiado grande' }, { status: 413 });
  if (!verifyWebhookSignature(raw, request.headers.get('x-signature'), process.env.LEMONSQUEEZY_WEBHOOK_SECRET)) return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  let payload;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Contenido inválido' }, { status: 400 }); }
  const event = payload?.meta?.event_name;
  if (!BILLING_EVENTS.has(event)) return NextResponse.json({ received: true, ignored: true });
  const providerId = webhookSubscriptionId(event, payload?.data);
  if (!providerId) return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  try {
    const admin = createAdminClient();
    const eventId = createHash('sha256').update(raw).digest('hex');
    const { data: processed, error: readError } = await admin.from('billing_webhook_events').select('id').eq('id', eventId).maybeSingle();
    if (readError) throw new Error('Billing ledger unavailable');
    if (processed) return NextResponse.json({ received: true, duplicate: true });
    // Invoice ids are not subscription ids. Always fetch the canonical subscription
    // so reordered deliveries cannot roll access back to an old provider state.
    const latest = await lemonRequest(`/subscriptions/${encodeURIComponent(String(providerId))}`);
    const snapshot = subscriptionSnapshot(latest.data, billingConfiguration());
    if (snapshot.id !== String(providerId)) throw new Error('Subscription identity mismatch');
    const { data: existing, error: ownershipError } = await admin.from('subscriptions').select('user_id').eq('provider_subscription_id', snapshot.id).maybeSingle();
    if (ownershipError) throw new Error('Subscription ownership unavailable');
    const customUser = payload?.meta?.custom_data?.user_id;
    if (existing && customUser && customUser !== existing.user_id) return NextResponse.json({ error: 'Propietario inválido' }, { status: 400 });
    const userId = existing?.user_id ?? customUser;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId ?? '')) {
      // Retry rather than marking an unassociated invoice permanently processed.
      return NextResponse.json({ error: 'Suscripción pendiente de asociación' }, { status: 503 });
    }
    const { data, error } = await admin.rpc('apply_billing_webhook', { p_event_id: eventId, p_event_name: event, p_user_id: userId, p_snapshot: snapshot });
    if (error) throw new Error('Subscription synchronization failed');
    return NextResponse.json({ received: true, ...data });
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error('Billing synchronization failed'));
    return NextResponse.json({ error: 'No se pudo sincronizar. Reintenta el evento.' }, { status: 503 });
  }
}
