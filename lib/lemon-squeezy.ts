import "server-only";
import { safeLemonUrl } from '@/lib/billing-webhook';
const API_URL = 'https://api.lemonsqueezy.com/v1';
export function billingConfiguration() {
  return { store: required('LEMONSQUEEZY_STORE_ID'), monthly: required('LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID'), annual: process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID, testMode: process.env.LEMONSQUEEZY_TEST_MODE === 'true' };
}
function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value; }
export async function lemonRequest(path: string, body?: unknown) {
  const response = await fetch(`${API_URL}${path}`, { method: body ? 'POST' : 'GET',
    headers: { Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json', Authorization: `Bearer ${required('LEMONSQUEEZY_API_KEY')}` },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Billing provider unavailable (${response.status})`);
  return response.json();
}
export type BillingInterval = 'monthly' | 'annual';
export async function createProCheckout(user: { id: string; email?: string }, interval: BillingInterval, monthlyPrice = 350) {
  const config = billingConfiguration();
  const variantId = interval === 'monthly' ? config.monthly : required('LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID');
  const [prices, store] = await Promise.all([
    lemonRequest(`/prices?filter[variant_id]=${encodeURIComponent(variantId)}`),
    lemonRequest(`/stores/${encodeURIComponent(config.store)}`),
  ]);
  const unit = interval === 'monthly' ? 'month' : 'year';
  const price = prices.data?.[0]?.attributes;
  const recurring = String(price?.variant_id) === variantId && price?.category === 'subscription' && price.renewal_interval_unit === unit && price.renewal_interval_quantity === 1 && !price.setup_fee_enabled && !price.usage_aggregation && price.scheme === 'standard';
  if (!recurring || store.data?.attributes?.currency !== 'USD') throw new Error('Invalid recurring product configuration');
  const payload = await lemonRequest('/checkouts', { data: { type: 'checkouts', attributes: {
    custom_price: interval === 'monthly' ? monthlyPrice : 3999,
    test_mode: config.testMode,
    expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
    checkout_options: { skip_trial: true, subscription_preview: true },
    checkout_data: { email: user.email, custom: { user_id: user.id } },
    product_options: { enabled_variants: [Number(variantId)], redirect_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://multilinksrd.vercel.app'}/planes?checkout=success` },
  }, relationships: { store: { data: { type: 'stores', id: config.store } }, variant: { data: { type: 'variants', id: variantId } } } } });
  const url = safeLemonUrl(payload.data?.attributes?.url);
  if (!url) throw new Error('Checkout unavailable');
  return url;
}
