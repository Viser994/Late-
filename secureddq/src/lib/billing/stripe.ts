import Stripe from "stripe";
import type { PlanTier } from "@prisma/client";

let stripe: Stripe | null = null;

/** Whether Stripe billing is configured. */
export function hasStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Shared Stripe client, or null when unconfigured (dev/demo). */
export function getStripe(): Stripe | null {
  if (!hasStripe()) return null;
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion });
  }
  return stripe;
}

/** Map a plan tier to its configured Stripe price id. */
export function priceIdForPlan(plan: PlanTier): string | null {
  switch (plan) {
    case "STARTER":
      return process.env.STRIPE_PRICE_STARTER ?? null;
    case "PROFESSIONAL":
      return process.env.STRIPE_PRICE_PROFESSIONAL ?? null;
    default:
      return null;
  }
}

export interface CheckoutParams {
  plan: PlanTier;
  organizationId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout session for a plan upgrade. In demo mode (no key)
 * this returns a local URL that simulates a successful checkout so the billing
 * flow is navigable end-to-end.
 */
export async function createCheckoutSession(params: CheckoutParams): Promise<{ url: string }> {
  const client = getStripe();
  const priceId = priceIdForPlan(params.plan);
  if (client && priceId) {
    const session = await client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.organizationId,
      subscription_data: { metadata: { organizationId: params.organizationId, plan: params.plan } },
    });
    return { url: session.url ?? params.cancelUrl };
  }
  return { url: `${params.successUrl}&demo=1&plan=${params.plan}` };
}

/** Create a Stripe billing portal session, or a local fallback in demo mode. */
export async function createBillingPortalSession(customerId: string | null, returnUrl: string): Promise<{ url: string }> {
  const client = getStripe();
  if (client && customerId) {
    const session = await client.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
    return { url: session.url };
  }
  return { url: `${returnUrl}?portal=demo` };
}
