import { SubscriptionPlan } from "@prisma/client";

export const planLimits = {
  FREE: {
    users: 2,
    documents: 10,
    questionnairesPerMonth: 1,
    ai: "basic"
  },
  STARTER: {
    users: 5,
    documents: 100,
    questionnairesPerMonth: Number.POSITIVE_INFINITY,
    ai: "standard"
  },
  PROFESSIONAL: {
    users: Number.POSITIVE_INFINITY,
    documents: Number.POSITIVE_INFINITY,
    questionnairesPerMonth: Number.POSITIVE_INFINITY,
    ai: "advanced"
  },
  ENTERPRISE: {
    users: Number.POSITIVE_INFINITY,
    documents: Number.POSITIVE_INFINITY,
    questionnairesPerMonth: Number.POSITIVE_INFINITY,
    ai: "unlimited"
  }
} satisfies Record<SubscriptionPlan, Record<string, number | string>>;

export function canUseFeature(
  plan: SubscriptionPlan,
  feature: "api" | "advanced_exports" | "approval_workflows" | "sso"
) {
  const allowed = {
    api: ["PROFESSIONAL", "ENTERPRISE"],
    advanced_exports: ["PROFESSIONAL", "ENTERPRISE"],
    approval_workflows: ["PROFESSIONAL", "ENTERPRISE"],
    sso: ["ENTERPRISE"]
  } satisfies Record<typeof feature, SubscriptionPlan[]>;

  return allowed[feature].includes(plan);
}
