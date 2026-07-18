import type { SubscriptionPlan } from "@prisma/client";

export interface PlanLimits {
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  stripePriceId?: string;
  features: string[];
  limits: {
    users: number;
    documents: number;
    questionnairesPerMonth: number;
    aiChat: boolean;
    complianceDashboard: boolean;
    approvalWorkflows: boolean;
    analytics: boolean;
    apiAccess: boolean;
    advancedExports: boolean;
    sso: boolean;
    prioritySupport: boolean;
  };
}

export const PLANS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    name: "Free",
    description: "Get started with basic security questionnaire automation",
    price: 0,
    priceLabel: "$0",
    features: [
      "1 organization",
      "2 users",
      "10 document uploads",
      "1 questionnaire per month",
      "Basic AI responses",
      "Community support",
    ],
    limits: {
      users: 2,
      documents: 10,
      questionnairesPerMonth: 1,
      aiChat: false,
      complianceDashboard: false,
      approvalWorkflows: false,
      analytics: false,
      apiAccess: false,
      advancedExports: false,
      sso: false,
      prioritySupport: false,
    },
  },
  STARTER: {
    name: "Starter",
    description: "For growing security teams handling regular questionnaires",
    price: 4900,
    priceLabel: "$49",
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      "5 users",
      "100 documents",
      "Unlimited questionnaires",
      "AI chat",
      "Compliance dashboard",
      "Email support",
    ],
    limits: {
      users: 5,
      documents: 100,
      questionnairesPerMonth: -1,
      aiChat: true,
      complianceDashboard: true,
      approvalWorkflows: false,
      analytics: false,
      apiAccess: false,
      advancedExports: false,
      sso: false,
      prioritySupport: false,
    },
  },
  PROFESSIONAL: {
    name: "Professional",
    description: "For teams that need advanced workflows and analytics",
    price: 19900,
    priceLabel: "$199",
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
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
    limits: {
      users: -1,
      documents: -1,
      questionnairesPerMonth: -1,
      aiChat: true,
      complianceDashboard: true,
      approvalWorkflows: true,
      analytics: true,
      apiAccess: true,
      advancedExports: true,
      sso: false,
      prioritySupport: true,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: 0,
    priceLabel: "Custom",
    features: [
      "Everything in Professional",
      "Unlimited AI usage",
      "SSO (SAML/OIDC)",
      "Dedicated onboarding",
      "Custom integrations",
      "SLA",
      "Private cloud options",
      "Dedicated account manager",
      "Audit assistance",
      "Advanced security controls",
    ],
    limits: {
      users: -1,
      documents: -1,
      questionnairesPerMonth: -1,
      aiChat: true,
      complianceDashboard: true,
      approvalWorkflows: true,
      analytics: true,
      apiAccess: true,
      advancedExports: true,
      sso: true,
      prioritySupport: true,
    },
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits["limits"] {
  return PLANS[plan].limits;
}

export function canUseFeature(
  plan: SubscriptionPlan,
  feature: keyof PlanLimits["limits"]
): boolean {
  const value = PLANS[plan].limits[feature];
  if (typeof value === "boolean") return value;
  return value !== 0;
}
