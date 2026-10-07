import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
export const BILLING_EVENTS = new Set(['subscription_created','subscription_updated','subscription_cancelled','subscription_resumed','subscription_expired','subscription_paused','subscription_unpaused','subscription_payment_success','subscription_payment_failed','subscription_payment_recovered','subscription_payment_refunded']);
export function verifyWebhookSignature(body: string, signature: string | null, secret: string | undefined) {
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac('sha256', secret).update(body).digest(), Buffer.from(signature, 'hex'));
}
export function safeLemonUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (u.hostname === 'lemonsqueezy.com' || u.hostname.endsWith('.lemonsqueezy.com')) ? value : null; } catch { return null; }
}
const id = z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).transform(String);
export function webhookSubscriptionId(event: string, data: unknown) {
  const parsed = z.object({ id: z.unknown().optional(), attributes: z.object({ subscription_id: z.unknown().optional() }).passthrough().optional() }).passthrough().safeParse(data);
  if (!parsed.success) return null;
  const value = event.startsWith('subscription_payment_') ? parsed.data.attributes?.subscription_id : parsed.data.id;
  const result = id.safeParse(value);
  return result.success ? result.data : null;
}
const date = z.string().datetime({ offset: true });
const schema = z.object({ type: z.literal('subscriptions'), id, attributes: z.object({
  store_id: id, variant_id: id, customer_id: id, test_mode: z.boolean(),
  status: z.enum(['on_trial','active','past_due','cancelled','expired','paused','unpaid']),
  created_at: date, updated_at: date,
  renews_at: date.nullable().optional(), ends_at: date.nullable().optional(), trial_ends_at: date.nullable().optional(),
  urls: z.object({ customer_portal: z.string().nullable().optional(), update_payment_method: z.string().nullable().optional() }).optional(),
}) });
export type BillingConfiguration = { store: string; monthly: string; annual?: string; testMode: boolean };
export function subscriptionSnapshot(resource: unknown, config: BillingConfiguration) {
  const parsed = schema.parse(resource); const a = parsed.attributes;
  if (a.store_id !== config.store || a.test_mode !== config.testMode || ![config.monthly, config.annual].includes(a.variant_id)) throw new Error('Unsupported billing configuration');
  const status = a.status === 'on_trial' ? 'trialing' : a.status === 'cancelled' ? 'canceled' : a.status;
  const period_end = ['cancelled','expired'].includes(a.status) ? a.ends_at : a.status === 'on_trial' ? a.trial_ends_at : a.renews_at;
  if (['active','on_trial','cancelled'].includes(a.status) && !period_end) throw new Error('Missing subscription period');
  return { id: parsed.id, customer_id: a.customer_id, variant_id: a.variant_id,
    status, provider_status: a.status, created_at: a.created_at, updated_at: a.updated_at,
    interval: a.variant_id === config.monthly ? 'monthly' : 'annual', period_end: period_end ?? null,
    portal_url: safeLemonUrl(a.urls?.customer_portal ?? a.urls?.update_payment_method) };
}
