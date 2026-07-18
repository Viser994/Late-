import Stripe from "stripe";
import { SubscriptionPlan } from "@prisma/client";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
} as any);

export const PLANS: Record<
  SubscriptionPlan,
  {
    name: string;
    price: number;
    priceId: string | null;
    limits: {
      users: number;
      documents: number;
      questionnairesPerMonth: number;
      aiCreditsPerMonth: number;
    };
    features: string[];
  }
> = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      users: 2,
      documents: 10,
      questionnairesPerMonth: 1,
      aiCreditsPerMonth: 50,
    },
    features: [
      "1 organization",
      "2 users",
      "10 document uploads",
      "1 questionnaire per month",
      "Basic AI responses",
      "Community support",
    ],
  },
  STARTER: {
    name: "Starter",
    price: 4900,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
    limits: {
      users: 5,
      documents: 100,
      questionnairesPerMonth: -1, // unlimited
      aiCreditsPerMonth: 500,
    },
    features: [
      "5 users",
      "100 documents",
      "Unlimited questionnaires",
      "AI chat",
      "Compliance dashboard",
      "Email support",
    ],
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 19900,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID ?? null,
    limits: {
      users: -1, // unlimited
      documents: -1, // unlimited
      questionnairesPerMonth: -1, // unlimited
      aiCreditsPerMonth: -1, // unlimited
    },
    features: [
      "Unlimited users",
      "Unlimited documents",
      "Advanced AI",
      "Approval workflows",
      "Analytics",
      "API access",
      "Priority support",
      "Advanced exports",
      "Custom templates",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 0,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
    limits: {
      users: -1,
      documents: -1,
      questionnairesPerMonth: -1,
      aiCreditsPerMonth: -1,
    },
    features: [
      "Everything in Professional",
      "Unlimited AI usage",
      "SSO (SAML/OIDC)",
      "Dedicated onboarding",
      "Custom integrations",
      "SLA guarantee",
      "Private cloud options",
      "Dedicated account manager",
    ],
  },
};

export async function createStripeCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name });
}

export async function createCheckoutSession({
  customerId,
  priceId,
  organizationId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { organizationId },
    subscription_data: {
      metadata: { organizationId },
    },
  });
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
