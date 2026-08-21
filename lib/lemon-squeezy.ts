import "server-only";
import * as Sentry from "@sentry/nextjs";

const API_URL = "https://api.lemonsqueezy.com/v1";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export type BillingInterval = "monthly" | "annual";

export async function createProCheckout(user: { id: string; email?: string }, interval: BillingInterval) {
  const variantId = interval === "annual"
    ? required("LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID")
    : required("LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID");
  const response = await fetch(`${API_URL}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${required("LEMONSQUEEZY_API_KEY")}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          ...(interval === "monthly" ? { custom_price: 350 } : {}),
          checkout_data: { email: user.email, custom: { user_id: user.id } },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://multilinksrd.vercel.app"}/planes?checkout=success`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: required("LEMONSQUEEZY_STORE_ID") } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok || !payload?.data?.attributes?.url) {
    Sentry.captureException(new Error("Lemon Squeezy checkout request failed"));
    console.error("Lemon Squeezy checkout error", response.status, payload?.errors);
    throw new Error("Checkout unavailable");
  }
  return payload.data.attributes.url as string;
}
