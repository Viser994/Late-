import Stripe from "stripe";
import { db } from "@/lib/db";
import { PLANS } from "./plans";
import type { SubscriptionPlan } from "@prisma/client";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export function getStripe(): Stripe {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return globalForStripe.stripe;
}

export async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string,
  name: string
): Promise<string> {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { organizationId },
  });

  await db.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      stripeCustomerId: customer.id,
      plan: "FREE",
      status: "ACTIVE",
    },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(params: {
  organizationId: string;
  plan: SubscriptionPlan;
  email: string;
  orgName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const planConfig = PLANS[params.plan];
  if (!planConfig.stripePriceId) {
    throw new Error("Plan not available for checkout");
  }

  const customerId = await getOrCreateStripeCustomer(
    params.organizationId,
    params.email,
    params.orgName
  );

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      organizationId: params.organizationId,
      plan: params.plan,
    },
    subscription_data: {
      metadata: {
        organizationId: params.organizationId,
        plan: params.plan,
      },
    },
  });

  return session.url!;
}

export async function createBillingPortalSession(
  organizationId: string,
  returnUrl: string
): Promise<string> {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

const PLAN_FROM_PRICE: Record<string, SubscriptionPlan> = {
  [process.env.STRIPE_STARTER_PRICE_ID ?? ""]: "STARTER",
  [process.env.STRIPE_PROFESSIONAL_PRICE_ID ?? ""]: "PROFESSIONAL",
};

export async function handleSubscriptionUpdate(
  stripeSubscription: Stripe.Subscription
) {
  const organizationId = stripeSubscription.metadata.organizationId;
  if (!organizationId) return;

  const priceId = stripeSubscription.items.data[0]?.price.id;
  const plan = PLAN_FROM_PRICE[priceId ?? ""] ?? "FREE";
  const firstItem = stripeSubscription.items.data[0];

  await db.subscription.update({
    where: { organizationId },
    data: {
      plan,
      status: mapStripeStatus(stripeSubscription.status),
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      currentPeriodStart: firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  const map: Record<string, "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    unpaid: "PAST_DUE",
    paused: "CANCELED",
  };
  return map[status] ?? "ACTIVE";
}
