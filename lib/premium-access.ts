export type PremiumFeature = 'unlimited_links' | 'smart_media' | 'custom_background' | 'premium_themes' | 'cover_image' | 'advanced_analytics' | 'analytics_export' | 'remove_branding';
export type AccountAccess = {
  has_premium: boolean;
  source: 'free' | 'trial' | 'subscription' | 'admin';
  state: 'FREE' | 'TRIAL' | 'PREMIUM_ACTIVE' | 'PREMIUM_PAST_DUE' | 'PREMIUM_CANCELED' | 'PREMIUM_EXPIRED';
  trial_started_at: string | null; trial_ends_at: string | null; trial_status: 'active' | 'expired';
  access_ends_at: string | null; days_remaining: number | null;
  subscription_status: string | null; has_subscription: boolean; billing_interval: 'monthly' | 'annual' | null;
  active_link_limit: number | null; price_monthly: number; server_time: string;
  features: Record<string, boolean>;
};
// This function consumes the server's entitlement matrix; it never evaluates dates or payments.
export function canUseFeature(access: AccountAccess | null, feature: PremiumFeature) {
  return access?.features[feature] === true;
}
export function hasPremiumAccess(access: AccountAccess | null) { return access?.has_premium === true; }
export function premiumCta(access: AccountAccess | null) {
  return access?.source === 'trial' ? 'Continuar con Premium' : access?.has_subscription ? 'Reactivar Premium' : 'Activar Premium';
}
export function premiumPrice(cents = 350) { return `US$${(cents / 100).toFixed(2)}/mes`; }
