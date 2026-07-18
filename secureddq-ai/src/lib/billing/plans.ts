export type PlanLimit = {
  users: number | "unlimited";
  documents: number | "unlimited";
  questionnairesPerMonth: number | "unlimited";
  aiTier: "basic" | "advanced" | "unlimited";
  features: string[];
};

export const PLAN_LIMITS: Record<"FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE", PlanLimit> = {
  FREE: {
    users: 2,
    documents: 10,
    questionnairesPerMonth: 1,
    aiTier: "basic",
    features: ["Community support"],
  },
  STARTER: {
    users: 5,
    documents: 100,
    questionnairesPerMonth: "unlimited",
    aiTier: "basic",
    features: ["AI chat", "Compliance dashboard", "Email support"],
  },
  PROFESSIONAL: {
    users: "unlimited",
    documents: "unlimited",
    questionnairesPerMonth: "unlimited",
    aiTier: "advanced",
    features: [
      "Approval workflows",
      "Analytics",
      "API access",
      "Priority support",
      "Advanced exports",
      "Custom templates",
    ],
  },
  ENTERPRISE: {
    users: "unlimited",
    documents: "unlimited",
    questionnairesPerMonth: "unlimited",
    aiTier: "unlimited",
    features: [
      "SSO (SAML/OIDC)",
      "Dedicated onboarding",
      "Custom integrations",
      "SLA",
      "Private cloud options",
      "Audit assistance",
      "Advanced security controls",
    ],
  },
};
